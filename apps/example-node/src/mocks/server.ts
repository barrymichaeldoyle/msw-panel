import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export { handlers };

export const server = setupServer(...handlers);
