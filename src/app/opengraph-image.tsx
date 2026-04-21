import { ImageResponse } from "next/og";

export const alt = "GEO - Clarify direction and choose the next step";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(224, 242, 254) 45%, rgb(240, 253, 250) 100%)",
          padding: "64px",
          color: "rgb(15, 23, 42)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgb(14, 116, 144)",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "rgb(14, 116, 144)",
            }}
          />
          GEO
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: 880,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            <div>Clarify direction.</div>
            <div>Choose the next step.</div>
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgb(51, 65, 85)",
            }}
          >
            Support for people building in Japan who need a clearer path before
            they move.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "rgb(71, 85, 105)",
          }}
        >
          <div>kibouflow.com</div>
          <div>zh / ja</div>
        </div>
      </div>
    ),
    size,
  );
}
