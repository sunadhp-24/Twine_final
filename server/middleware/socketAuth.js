import jwt from "jsonwebtoken";

export const verifySocketToken = (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    console.error("Socket Auth Error: No cookies found.");
    return next(new Error("Authentication error: No cookies provided."));
  }

  try {
    const tokenCookieString = cookieHeader
      .split("; ")
      .find((row) => row.trim().startsWith("token="));

    if (!tokenCookieString) {
      console.error("Socket Auth Error: 'token' cookie not found.");
      return next(new Error("Authentication error: Token not found."));
    }

    let encodedTokenObject = tokenCookieString.split("=")[1];

    // --- THIS IS THE FIX ---
    // Remove the "j:" prefix if it exists
    if (encodedTokenObject.startsWith("j%3A")) {
      encodedTokenObject = encodedTokenObject.substring(4); // "j%3A" is "j:" URL encoded
    }
    // --- END OF FIX ---

    const decodedTokenObject = decodeURIComponent(encodedTokenObject);
    const tokenData = JSON.parse(decodedTokenObject);
    const jwtToken = tokenData.token;

    if (!jwtToken) {
      console.error(
        "Socket Auth Error: JWT string missing inside token object."
      );
      return next(new Error("Authentication error: Invalid token structure."));
    }

    jwt.verify(jwtToken, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        console.error(
          "Socket Auth Error: JWT verification failed.",
          err.message
        );
        return next(new Error("Authentication error: Invalid token."));
      }
      socket.user = user;
      next();
    });
  } catch (err) {
    console.error("Socket Auth Error: Failed to parse token.", err.message);
    next(new Error("Authentication error: Malformed token."));
  }
};
