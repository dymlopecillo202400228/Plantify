import crypto from "crypto";

function flattenObject(obj, prefix = "", result = []) {
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix
            ? `${prefix}.${key}`
            : key;

        if (
            value === null ||
            value === "" ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0) ||
            (
                typeof value === "object" &&
                !Array.isArray(value) &&
                Object.keys(value).length === 0
            )
        ) {
            continue;
        }

        if (typeof value === "object") {
            flattenObject(value, fullKey, result);
        } else {
            result.push(`${fullKey}=${String(value)}`);
        }
    }

    return result;
}

export function verifyMayaWebhook(req) {
    try {
        const signatureHeader =
            req.headers["x-maya-webhook-signature"];

        const timestamp =
            req.headers["x-maya-webhook-timestamp"];

        if (!signatureHeader || !timestamp) {
            return false;
        }

        const timestampNumber = Number(timestamp);

        if (!Number.isFinite(timestampNumber)) {
            return false;
        }

        const difference = Math.abs(
            Date.now() - timestampNumber
        );

        if (difference > 5 * 60 * 1000) {
            return false;
        }

        const parts = {};

        signatureHeader.split(",").forEach(part => {
            const index = part.indexOf("=");

            if (index !== -1) {
                parts[part.slice(0, index).trim()] =
                    part.slice(index + 1).trim();
            }
        });

        const nonce = parts.nonce;
        const signature = parts.v1;

        if (!nonce || !signature) {
            return false;
        }

        const flattened = flattenObject(req.body)
            .sort()
            .join("&");

        const signedMessage =
            `${flattened}&nonce=${nonce}`;

        const publicKeys = [
            process.env.MAYA_WEBHOOK_PUBLIC_KEY_1,
            process.env.MAYA_WEBHOOK_PUBLIC_KEY_2
        ].filter(Boolean).map(key =>
            key.replace(/\\n/g, "\n")
        );

        if (publicKeys.length !== 2) {
            return false;
        }

        return publicKeys.some(publicKey => {
            try {
                return crypto.verify(
                    "RSA-SHA256",
                    Buffer.from(signedMessage),
                    publicKey,
                    Buffer.from(signature, "hex")
                );
            } catch {
                return false;
            }
        });

    } catch (error) {
        return false;
    }
}