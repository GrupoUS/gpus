import { Inngest } from 'inngest';

// Create a new Inngest client
export const inngest = new Inngest({
  id: 'gpus-app',
  name: 'GPUs App',
  // The base URL of the Inngest API
  // In development, this defaults to http://localhost:8288
  // In production, you should set the INNGEST_EVENT_KEY environment variable
  // and the INNGEST_API_URL environment variable
});