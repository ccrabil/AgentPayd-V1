import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "#0A0A0D",
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#F2F4F7",
            letterSpacing: -1,
          }}
        >
          AP
        </span>
        <span
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#0066FF",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
