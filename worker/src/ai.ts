import type { Env } from "./types";

export async function callWorkersAI(env: Env, systemPrompt: string): Promise<string> {
  try {
    const response = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct" as Parameters<typeof env.AI.run>[0],
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please respond now." },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      } as Record<string, unknown>,
    );

    console.log("Workers AI raw response type:", typeof response);
    console.log("Workers AI raw response:", JSON.stringify(response).slice(0, 500));

    if (typeof response === "object" && response !== null && "response" in response) {
      const text = (response as { response: string }).response;
      if (!text || text.trim().length === 0) {
        console.warn("Workers AI returned empty response, falling back to mock");
        return getMockResponse(systemPrompt);
      }
      return text;
    }

    const text = String(response);
    if (!text || text.trim().length === 0) {
      console.warn("Workers AI returned empty string, falling back to mock");
      return getMockResponse(systemPrompt);
    }
    return text;
  } catch (err) {
    console.error("Workers AI call failed, using mock response:", err);
    return getMockResponse(systemPrompt);
  }
}

function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("generate one realistic") && lower.includes("interview question")) {
    if (lower.includes("backend")) {
      return "You're designing a REST API for an e-commerce platform that needs to handle 10,000 requests per second. How would you design the caching strategy? Consider cache invalidation, consistency, and what layers of caching you would use.";
    }
    if (lower.includes("object-oriented")) {
      return "Explain the Open/Closed Principle with a real-world example. How would you refactor a class that uses a large switch statement for handling different payment methods (credit card, PayPal, crypto) to follow this principle?";
    }
    if (lower.includes("sql")) {
      return "You have a `users` table and an `orders` table. Write a query to find the top 5 customers by total order value in the last 30 days, including customers who have registered but never placed an order (showing $0). Explain your choice of JOIN type.";
    }
    if (lower.includes("behavioral")) {
      return "Tell me about a time when you had to push back on a technical decision made by a senior engineer or manager. How did you approach the conversation, and what was the outcome?";
    }
    return "What are the trade-offs between using a monolithic architecture versus microservices? When would you choose one over the other?";
  }

  if (lower.includes("evaluating a candidate") || lower.includes("interviewer evaluating")) {
    return "Score: 7/10\n\nStrengths:\n- Demonstrates solid understanding of the core concepts\n- Response is logically structured and easy to follow\n- Correctly identifies the key components involved\n\nWeaknesses:\n- Could have gone deeper into edge cases and failure modes\n- Missing specific technologies or patterns to support the approach\n- Did not discuss trade-offs between alternatives\n\nImproved Answer:\nA stronger response would start by identifying the key constraints (latency, throughput, consistency), then propose a layered approach: browser cache (Cache-Control headers, 5-min TTL), CDN edge cache (Cloudflare/CloudFront for static + semi-dynamic content), application-level cache (Redis cluster with read replicas), and database query cache. For invalidation, use a combination of TTL for non-critical data and pub/sub event-driven invalidation (e.g., Redis Streams or SNS) for writes that must propagate immediately. Mention the trade-off between stale reads and invalidation cost.\n\nFollow-up Question:\nHow would you handle cache stampede (thundering herd) when a popular cache key expires and hundreds of requests hit the database simultaneously?";
  }

  // Check summary before hint — summary prompts include conversation history which may contain "hint"
  if (lower.includes("reviewing a practice session") || lower.includes("session summary")) {
    return "**Session Summary**\n\n- **Strongest areas**: Good conceptual understanding and clear communication\n- **Weakest areas**: Could provide more concrete examples and discuss trade-offs in depth\n- **Top 3 improvements**:\n  1. Practice structuring answers with the STAR method for behavioral questions\n  2. Include specific technologies and real-world numbers in technical answers\n  3. Always discuss failure modes and edge cases\n- **Suggested next topic**: System design — focus on distributed systems patterns";
  }

  if (lower.includes("harder follow-up")) {
    return "Now extend your previous answer: What happens when you need to support this across multiple data centers with eventual consistency? How would you handle conflict resolution and ensure data integrity?";
  }

  if (lower.includes("hint") || lower.includes("nudge")) {
    return "Think about the problem in layers. Start with the most straightforward approach, then consider what breaks at scale. What data structures or patterns could help you handle the key bottleneck?";
  }

  return "Great question! As your interview coach, I'd recommend breaking down complex problems into smaller parts. Would you like me to generate a practice question, or would you like to discuss a specific topic? You can ask for questions in Backend, OOP, SQL, or Behavioral categories.";
}
