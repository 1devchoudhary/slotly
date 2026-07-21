import { Request, Response } from 'express';
import {
  GoogleGenAI,
  Type,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/genai';
import { Service } from '../models/Service';
import { Staff } from '../models/Staff';
import { Booking } from '../models/Booking';
import { Settings } from '../models/Settings';
import { TimeOff } from '../models/TimeOff';
import { getAvailableSlots } from '../lib/availability';
import crypto from 'crypto';
import { toZonedTime } from 'date-fns-tz';

/** Overridable so a model can be swapped without a code change. */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/** Guards against a pathological tool loop burning the request budget. */
const MAX_TOOL_TURNS = 6;

const DEFAULT_SETTINGS = {
  businessName: 'Northside Dental',
  timezone: 'America/New_York',
  slotIntervalMin: 15,
  leadTimeMin: 120,
  maxAdvanceDays: 30,
};

async function resolveSettings() {
  return (await Settings.findOne()) ?? new Settings(DEFAULT_SETTINGS);
}

/* ------------------------------------------------------------------ *
 * Tools
 *
 * Each declaration is the schema the model sees; `handlers` holds the
 * implementation. Availability and booking both run through the same
 * `getAvailableSlots` engine the REST API uses, so the assistant can never
 * offer a slot the booking endpoint would reject.
 * ------------------------------------------------------------------ */

const declarations: FunctionDeclaration[] = [
  {
    name: 'list_services',
    description:
      "List all bookable services with duration and price. Call this when the customer asks what's offered or names a treatment.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'check_availability',
    description:
      'Get real open appointment slots for a service on a date. Call this before ever suggesting a time — never guess availability.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        serviceId: { type: Type.STRING, description: 'The service _id' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD in the business timezone' },
        staffId: { type: Type.STRING, description: 'Optional staff _id to narrow the search' },
      },
      required: ['serviceId', 'date'],
    },
  },
  {
    name: 'create_booking',
    description:
      'Book a confirmed appointment. Only call after the customer has explicitly confirmed the exact time AND given their name, email, and phone.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        serviceId: { type: Type.STRING },
        staffId: { type: Type.STRING },
        startAt: { type: Type.STRING, description: 'ISO 8601 UTC timestamp' },
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
      },
      required: ['serviceId', 'staffId', 'startAt', 'name', 'email', 'phone'],
    },
  },
];

type ToolArgs = Record<string, unknown>;

const handlers: Record<string, (args: ToolArgs) => Promise<string>> = {
  async list_services() {
    const services = await Service.find({ isActive: true }).select(
      'name description durationMin priceCents'
    );
    return JSON.stringify(services);
  },

  async check_availability(args) {
    const serviceId = String(args.serviceId ?? '');
    const date = String(args.date ?? '');
    const staffId = args.staffId ? String(args.staffId) : undefined;

    const service = await Service.findById(serviceId).catch(() => null);
    if (!service) return 'Error: Service not found.';

    const staffList = staffId
      ? await Staff.find({ _id: staffId }).populate('userId')
      : await Staff.find({ serviceIds: serviceId, isActive: true }).populate('userId');

    if (staffList.length === 0) return 'Error: No staff available for this service.';

    const settings = await resolveSettings();
    const results: string[] = [];

    for (const staff of staffList) {
      const [existingBookings, timeOff] = await Promise.all([
        Booking.find({ staffId: staff._id, status: 'confirmed', startAt: { $gte: new Date() } }),
        TimeOff.find({ staffId: staff._id, endAt: { $gte: new Date() } }),
      ]);

      const slots = getAvailableSlots({
        staff: staff as any,
        service,
        date,
        timezone: settings.timezone,
        existingBookings,
        timeOff,
        settings: settings as any,
      });

      if (slots.length > 0) {
        const name = (staff.userId as any)?.name ?? 'Team member';
        results.push(
          `Staff: ${name} (ID: ${staff._id})\n` +
            `Available slots (UTC): ${slots.map((s) => s.startAt.toISOString()).join(', ')}`
        );
      }
    }

    return results.length > 0 ? results.join('\n\n') : 'No available slots on this date.';
  },

  async create_booking(args) {
    const serviceId = String(args.serviceId ?? '');
    const staffId = String(args.staffId ?? '');
    const startAt = String(args.startAt ?? '');

    const [service, staff] = await Promise.all([
      Service.findById(serviceId).catch(() => null),
      Staff.findById(staffId).catch(() => null),
    ]);
    if (!service || !staff) return 'Error: Service or staff not found.';

    const settings = await resolveSettings();
    const startAtDate = new Date(startAt);
    if (Number.isNaN(startAtDate.getTime())) return 'Error: Invalid start time.';

    // Re-derive the local date so the availability check uses the same day the
    // slot actually falls on in the business timezone.
    const local = toZonedTime(startAtDate, settings.timezone);
    const dateStr = [
      local.getFullYear(),
      String(local.getMonth() + 1).padStart(2, '0'),
      String(local.getDate()).padStart(2, '0'),
    ].join('-');

    const [existingBookings, timeOff] = await Promise.all([
      Booking.find({ staffId, status: 'confirmed', startAt: { $gte: new Date() } }),
      TimeOff.find({ staffId, endAt: { $gte: new Date() } }),
    ]);

    const slots = getAvailableSlots({
      staff: staff as any,
      service,
      date: dateStr,
      timezone: settings.timezone,
      existingBookings,
      timeOff,
      settings: settings as any,
    });

    // The model does not get to decide whether a slot is free.
    const isValid = slots.some((s) => s.startAt.getTime() === startAtDate.getTime());
    if (!isValid) {
      return 'Error: That slot is no longer available. Check availability again and offer alternatives.';
    }

    const manageToken = crypto.randomBytes(32).toString('hex');
    await Booking.create({
      serviceId,
      staffId,
      customer: {
        name: String(args.name ?? ''),
        email: String(args.email ?? ''),
        phone: String(args.phone ?? ''),
      },
      startAt: startAtDate,
      endAt: new Date(startAtDate.getTime() + service.durationMin * 60000),
      manageToken,
      status: 'confirmed',
      source: 'assistant',
    });

    return `Success! Booking confirmed. Manage token: ${manageToken}`;
  },
};

/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are the AI Booking Assistant for Northside Dental.
- Never invent availability — always call check_availability first.
- Never book without an explicit confirmation of the exact time plus name, email, and phone.
- State times in the business timezone and name the zone.
- If nothing is open, offer the nearest alternatives.
- Be concise and warm. Never reveal tool names, IDs, or internal errors to the user.`;

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Map the client's transcript onto Gemini's `Content` shape. */
function toGeminiHistory(messages: IncomingMessage[]): Content[] {
  return messages
    .filter((m) => typeof m?.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

export const chatWithAssistant = async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Degrade politely rather than 500 — the rest of the app works without a key.
  if (!apiKey) {
    return res.json({
      reply:
        "The AI assistant isn't configured on this deployment. You can still book through the booking page — everything there is live.",
      configured: false,
    });
  }

  try {
    const messages: IncomingMessage[] = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];
    if (messages.length === 0) {
      return res.status(400).json({ error: 'messages is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents = toGeminiHistory(messages);

    // Agentic loop: Gemini returns function calls, we execute them and feed the
    // results back until it produces prose (or we hit the turn ceiling).
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: declarations }],
        },
      });

      const calls = response.functionCalls ?? [];

      if (calls.length === 0) {
        return res.json({ reply: response.text ?? "Sorry, I didn't catch that." });
      }

      // Echo the model's own turn back before appending results.
      const modelParts = response.candidates?.[0]?.content?.parts;
      if (modelParts?.length) contents.push({ role: 'model', parts: modelParts });

      const resultParts: Part[] = [];
      for (const call of calls) {
        const handler = call.name ? handlers[call.name] : undefined;
        let output: string;
        try {
          output = handler
            ? await handler((call.args ?? {}) as ToolArgs)
            : `Error: unknown tool ${call.name}`;
        } catch {
          output = 'Error: that lookup failed. Tell the user and suggest trying again.';
        }

        resultParts.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { result: output },
          },
        });
      }

      contents.push({ role: 'user', parts: resultParts });
    }

    return res.json({
      reply:
        "I'm having trouble pinning that down. Could you tell me the service and a day that suits you?",
    });
  } catch (error: any) {
    const detail = error?.message ?? String(error);
    console.error('Assistant error:', detail);

    // An unusable key is the single most common setup mistake — say so plainly
    // instead of returning an opaque 500.
    if (/API key|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(detail)) {
      return res.status(200).json({
        reply:
          "The AI assistant's API key isn't valid, so I can't answer right now. The booking page still works — everything there is live.",
        configured: false,
      });
    }

    res.status(500).json({
      error: 'Failed to chat with assistant',
      detail: process.env.NODE_ENV === 'production' ? undefined : detail,
    });
  }
};
