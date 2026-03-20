import type { MethodDef } from "./types";

const methods: MethodDef[] = [
  // ── Orders ──────────────────────────────────────────────
  {
    id: "orders.create",
    resource: "Orders",
    description: "Submit a new order.",
    params: [
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify(
          {
            shippingMethod: "Budget",
            recipient: {
              name: "John Doe",
              address: {
                line1: "123 Main St",
                townOrCity: "London",
                postalOrZipCode: "SW1A 1AA",
                countryCode: "GB",
              },
            },
            items: [
              {
                sku: "GLOBAL-PHO-4x6",
                copies: 1,
                sizing: "fillPrintArea",
                assets: [
                  {
                    printArea: "default",
                    url: "https://example.com/image.jpg",
                  },
                ],
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
    execute: (client, values) =>
      client.orders.create(JSON.parse(values.request)),
  },
  {
    id: "orders.get",
    resource: "Orders",
    description: "Fetch a single order by ID.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
    ],
    execute: (client, values) => client.orders.get(values.orderId),
  },
  {
    id: "orders.getActions",
    resource: "Orders",
    description: "Get available actions for an order.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
    ],
    execute: (client, values) => client.orders.getActions(values.orderId),
  },
  {
    id: "orders.cancel",
    resource: "Orders",
    description: "Cancel an order.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
    ],
    execute: (client, values) => client.orders.cancel(values.orderId),
  },
  {
    id: "orders.updateShippingMethod",
    resource: "Orders",
    description: "Update the shipping method for an order.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify({ shippingMethod: "Express" }, null, 2),
      },
    ],
    execute: (client, values) =>
      client.orders.updateShippingMethod(
        values.orderId,
        JSON.parse(values.request),
      ),
  },
  {
    id: "orders.updateRecipient",
    resource: "Orders",
    description: "Update the recipient for an order.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify(
          {
            name: "Jane Doe",
            address: {
              line1: "456 High St",
              townOrCity: "London",
              postalOrZipCode: "EC1A 1BB",
              countryCode: "GB",
            },
          },
          null,
          2,
        ),
      },
    ],
    execute: (client, values) =>
      client.orders.updateRecipient(values.orderId, JSON.parse(values.request)),
  },
  {
    id: "orders.updateMetadata",
    resource: "Orders",
    description: "Update metadata on an order.",
    params: [
      { name: "orderId", label: "Order ID", kind: "string", required: true },
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify(
          { metadata: { myRef: "abc-123" } },
          null,
          2,
        ),
      },
    ],
    execute: (client, values) =>
      client.orders.updateMetadata(values.orderId, JSON.parse(values.request)),
  },

  // ── Quotes ──────────────────────────────────────────────
  {
    id: "quotes.create",
    resource: "Quotes",
    description: "Request a quote for a potential order.",
    params: [
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify(
          {
            shippingMethod: "Budget",
            destinationCountryCode: "GB",
            items: [
              {
                sku: "GLOBAL-PHO-4x6",
                copies: 1,
                assets: [{ printArea: "default" }],
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
    execute: (client, values) =>
      client.quotes.create(JSON.parse(values.request)),
  },

  // ── Products ────────────────────────────────────────────
  {
    id: "products.get",
    resource: "Products",
    description: "Get product details by SKU.",
    params: [
      {
        name: "sku",
        label: "SKU",
        kind: "string",
        required: true,
        defaultValue: "GLOBAL-PHO-4x6",
      },
    ],
    execute: (client, values) => client.products.get(values.sku),
  },
  {
    id: "products.getSpine",
    resource: "Products",
    description: "Calculate spine width for book-type products.",
    params: [
      {
        name: "request",
        label: "Request body",
        kind: "json",
        required: true,
        defaultValue: JSON.stringify(
          {
            sku: "GLOBAL-HPB-CR-8x10",
            destinationCountryCode: "GB",
            numberOfPages: 100,
          },
          null,
          2,
        ),
      },
    ],
    execute: (client, values) =>
      client.products.getSpine(JSON.parse(values.request)),
  },
];

export default methods;

export function getMethodGroups(): Map<string, MethodDef[]> {
  const groups = new Map<string, MethodDef[]>();
  for (const m of methods) {
    const list = groups.get(m.resource) ?? [];
    list.push(m);
    groups.set(m.resource, list);
  }
  return groups;
}
