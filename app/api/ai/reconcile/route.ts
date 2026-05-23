import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export type TxCategory = 'unreviewed' | 'business_income' | 'business_expense' | 'personal';

export type Tx = {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  category: TxCategory;
};

export type ReconcileAction =
  | { type: 'categorize'; ids: string[]; category: TxCategory }
  | { type: 'categorize_matching'; keyword: string; category: TxCategory; ids: string[] };

const tools: Anthropic.Tool[] = [
  {
    name: 'categorize_transactions',
    description: 'Categorize specific transactions by their IDs. Use this to set the category of one or more transactions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transaction_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of transaction_id values to categorize',
        },
        category: {
          type: 'string',
          enum: ['business_income', 'business_expense', 'personal', 'unreviewed'],
          description: 'The category to assign',
        },
      },
      required: ['transaction_ids', 'category'],
    },
  },
  {
    name: 'categorize_matching',
    description: 'Categorize all transactions whose description contains a keyword (case-insensitive).',
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to match against transaction descriptions',
        },
        category: {
          type: 'string',
          enum: ['business_income', 'business_expense', 'personal', 'unreviewed'],
          description: 'The category to assign to matching transactions',
        },
      },
      required: ['keyword', 'category'],
    },
  },
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, transactions } = await req.json() as {
    messages: Anthropic.MessageParam[];
    transactions: Tx[];
  };

  const txSummary = transactions.map(t =>
    `[${t.transaction_id}] ${new Date(t.timestamp).toLocaleDateString('en-GB')} | ${t.description} | ${t.amount >= 0 ? '+' : '-'}£${Math.abs(t.amount).toFixed(2)} | ${t.category}`
  ).join('\n');

  const systemPrompt = `You are a helpful tax assistant embedded in EasyTax, a UK tax filing app for freelancers.

The user is on the Reconcile page, reviewing their bank transactions. Your job is to help them categorise transactions quickly using natural language.

Categories:
- business_income: money received for work/services
- business_expense: costs for running the business (allowable for tax)
- personal: non-business transactions
- unreviewed: not yet categorised

Current transactions (${transactions.length} total):
${txSummary}

When the user gives you an instruction, use the available tools to perform the action. After calling tools, give a short, friendly confirmation of what you did. Be concise.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages,
  });

  const actions: ReconcileAction[] = [];

  for (const block of response.content) {
    if (block.type !== 'tool_use') continue;

    if (block.name === 'categorize_transactions') {
      const input = block.input as { transaction_ids: string[]; category: TxCategory };
      actions.push({ type: 'categorize', ids: input.transaction_ids, category: input.category });
    }

    if (block.name === 'categorize_matching') {
      const input = block.input as { keyword: string; category: TxCategory };
      const keyword = input.keyword.toLowerCase();
      const matchingIds = transactions
        .filter(t => t.description.toLowerCase().includes(keyword))
        .map(t => t.transaction_id);
      actions.push({ type: 'categorize_matching', keyword: input.keyword, category: input.category, ids: matchingIds });
    }
  }

  const replyBlock = response.content.find(b => b.type === 'text');
  const reply = replyBlock && replyBlock.type === 'text' ? replyBlock.text : '';

  // If there were tool calls but no text, send a follow-up to get a text response
  if (actions.length > 0 && !reply) {
    const toolResults: Anthropic.MessageParam = {
      role: 'user',
      content: response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result' as const,
          tool_use_id: (b as Anthropic.ToolUseBlock).id,
          content: 'Done.',
        })),
    };

    const followUp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: systemPrompt,
      tools,
      messages: [...messages, { role: 'assistant', content: response.content }, toolResults],
    });

    const followText = followUp.content.find(b => b.type === 'text');
    return NextResponse.json({
      reply: followText && followText.type === 'text' ? followText.text : 'Done.',
      actions,
    });
  }

  return NextResponse.json({ reply, actions });
}
