import { describe, expect, it } from "vitest";
import { isSecureRequest, sessionCookieOptions } from "@/lib/auth";

function request(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

describe("session cookie security", () => {
  it("marks the cookie secure when the proxy reports HTTPS", () => {
    expect(
      isSecureRequest(
        request("http://internal:3000/api/session", {
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(true);
  });

  it("does not mark the cookie secure for plain-HTTP deployments", () => {
    expect(isSecureRequest(request("http://ec2-host:3000/api/session"))).toBe(
      false,
    );
    expect(
      isSecureRequest(
        request("http://internal:3000/api/session", {
          "x-forwarded-proto": "http",
        }),
      ),
    ).toBe(false);
  });

  it("honours the first value of a forwarded-proto chain", () => {
    expect(
      isSecureRequest(
        request("http://internal:3000/api/session", {
          "x-forwarded-proto": "https, http",
        }),
      ),
    ).toBe(true);
  });

  it("keeps the cookie httpOnly and same-site", () => {
    const options = sessionCookieOptions(true);
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    expect(sessionCookieOptions(false).secure).toBe(false);
  });
});
