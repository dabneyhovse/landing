/// <reference path="../.astro/types.d.ts" />

interface User {
  sub: string;
  name: string;
  preferred_username: string;
  roles: string[];
  picture?: string;
}

declare namespace App {
  interface Locals {
    user: User | null;
  }
}
