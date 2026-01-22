import cron, { Patterns } from "@elysiajs/cron";
import { Elysia } from "elysia";
import twilio from "twilio";

// Initialize Twilio client (singleton pattern to prevent memory leaks)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const callerId = process.env.TWILIO_PHONE_NUMBER;

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .post("/webhook/call", async ({ body }) => {
    try {
      const { to, from, message } = body as {
        to: string;
        from?: string;
        message?: string;
      };

      // Validate required fields
      if (!to) {
        return {
          success: false,
          error: "Missing required field: 'to' (phone number to call)",
        };
      }

      // Use environment variable for 'from' if not provided
      const callerId = from || process.env.TWILIO_PHONE_NUMBER;
      if (!callerId) {
        return {
          success: false,
          error: "Missing 'from' phone number. Provide it in request or set TWILIO_PHONE_NUMBER env variable",
        };
      }

      // Make the phone call
      const call = await twilioClient.calls.create({
        to: to,
        from: callerId,
        url: process.env.TWIML_URL || "https://demo.twilio.com/welcome/voice/",
        // Optional: You can also use TwiML directly
        // twiml: `<Response><Say>${message || "Hello, this is a test call."}</Say></Response>`,
      });

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        message: "Phone call initiated successfully",
      };
    } catch (error) {
      console.error("Error making phone call:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  })
  .use(cron({
    name: "daily-call",
    timezone:"Europe/Istanbul",
    pattern: Patterns.everyDayAt("14:15"),
    run: async () => {
        console.log("Daily call");
        await twilioClient.calls.create({
          to: process.env.CALL_NUMBER || "",
          from: callerId || "",
          url: process.env.TWIML_URL || "https://demo.twilio.com/welcome/voice/",
          // Optional: You can also use TwiML directly
          // twiml: `<Response><Say>${message || "Hello, this is a test call."}</Say></Response>`,
        });
        
      },
    }),
  )
  .use(cron({
    name: "daily-call",
    timezone:"Europe/Istanbul",
    pattern: Patterns.everyDayAt("22:15"),
    run: async () => {
        console.log("Daily call");
        await twilioClient.calls.create({
          to: process.env.CALL_NUMBER || "",
          from: callerId || "",
          url: process.env.TWIML_URL || "https://demo.twilio.com/welcome/voice/",
          // Optional: You can also use TwiML directly
          // twiml: `<Response><Say>${message || "Hello, this is a test call."}</Say></Response>`,
        });
        
      },
    }),
  )
 /* .use(cron({
    name: "test-call",
    timezone:"Europe/Istanbul",
    pattern: Patterns.everyDayAt("23:42"),
    run: async () => {
        console.log("Test call");
        await twilioClient.calls.create({
          to: process.env.CALL_NUMBER || "",
          from: callerId || "",
          url: process.env.TWIML_URL || "https://demo.twilio.com/welcome/voice/",
          // Optional: You can also use TwiML directly
          // twiml: `<Response><Say>${message || "Hello, this is a test call."}</Say></Response>`,
        });
        
      },
    }),
  )*/
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

