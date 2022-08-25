import { ft } from "@/utils/ft";
import { User } from "@/types/api";
import { USERS_ROOT, AUTH_ROOT} from "@/constants/apiPaths"

export async function createUser(payload: {
  name: string;
  alias: string;
  publicKey: string;
}): Promise<{}> {
  const response = await ft(USERS_ROOT, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.message || "Failed to create User");
  }

  return response.json();
}
export async function getAuthenticationData(publicKey: string): Promise<{
  iv: Uint8Array;
  msg: Uint8Array;
  publicKey: Uint8Array;
}> {
  const response = await ft(`${AUTH_ROOT}/authenticationData/${publicKey}`);

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.message || "Failed to get authentication data");
  }

  const json = await response.json();
  for (let key in json) {
    json[key] = Uint8Array.from(json[key]);
  }
  return json;
}

export async function authenticate(
  decryptedMsg: Uint8Array,
  publicKey: string
): Promise<{ user: User }> {
  const response = await ft(`${AUTH_ROOT}/authenticate`, {
    method: "POST",
    body: JSON.stringify({ decryptedMsg: Array.from(decryptedMsg), publicKey }),
  });

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.message || "Failed to get authenticated");
  }

  return response.json();
}

export async function login() {
  const response = await ft(`${AUTH_ROOT}/login`);

  if (response.status === 401) {
    throw new Error("Failed to login");
  }

  return response.json();
}

export async function logout() {
  const response = await ft(`${AUTH_ROOT}/logout`, { method: "POST" });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}
