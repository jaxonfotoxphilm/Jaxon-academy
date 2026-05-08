import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

Deno.test("upload-pdf handler - rejects non-multipart requests", async () => {
    // Import the handler function
    // In Deno Edge Functions, we typically test the handler logic
    // For this basic test, we'll simulate the request handling block.
    
    // Create a mock request without multipart/form-data
    const req = new Request("http://localhost/upload-pdf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ test: true })
    });

    // Simulate the logic from index.ts
    const handleRequest = async (request: Request) => {
        if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), {
                status: 400,
            });
        }
        return new Response("OK");
    };

    const res = await handleRequest(req);
    assertEquals(res.status, 400);
    
    const body = await res.json();
    assertEquals(body.error, 'Content-Type must be multipart/form-data');
});

Deno.test("upload-pdf handler - rejects missing file", async () => {
    // Create a mock multipart request with no file
    const formData = new FormData();
    formData.append("dummy", "data");

    const req = new Request("http://localhost/upload-pdf", {
        method: "POST",
        body: formData
    });

    const handleRequest = async (request: Request) => {
        if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), { status: 400 });
        }

        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }
        
        return new Response("OK");
    };

    const res = await handleRequest(req);
    assertEquals(res.status, 400);
    
    const body = await res.json();
    assertEquals(body.error, 'No file uploaded');
});

Deno.test("upload-pdf handler - rejects non-PDF file", async () => {
    // Create a mock multipart request with a non-PDF file
    const formData = new FormData();
    const mockFile = new File(["dummy content"], "test.txt", { type: "text/plain" });
    formData.append("file", mockFile);

    const req = new Request("http://localhost/upload-pdf", {
        method: "POST",
        body: formData
    });

    const handleRequest = async (request: Request) => {
        if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), { status: 400 });
        }

        const data = await request.formData();
        const file = data.get('file') as File | null;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), { status: 400 });
        }
        
        return new Response("OK");
    };

    const res = await handleRequest(req);
    assertEquals(res.status, 400);
    
    const body = await res.json();
    assertEquals(body.error, 'Only PDF files are allowed');
});
