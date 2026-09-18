import type { JsonLdObject } from "@/lib/jsonld";

/** Serialises one or more schema.org objects into a script tag. "<" is escaped so no markup can break out. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
