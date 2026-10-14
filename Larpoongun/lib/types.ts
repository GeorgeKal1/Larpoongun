/** Shapes shared by the API routes and the browser. */

export interface PublicUser {
  id: number;
  email: string;
  name: string;
}

export interface CartLine {
  slug: string;
  qty: number;
}
