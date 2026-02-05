import { createClient } from '@supabase/supabase-js';

// Types for JSON-RPC 2.0
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

// Supabase client initialization (placeholder for environment variables)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * MCP Gateway: JSON-RPC implementation for Meatspace Bridge
 */
export async function handleMcpRequest(request: JsonRpcRequest, userId: string): Promise<JsonRpcResponse> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'create_task':
        return await create_task(params, userId, id);
      case 'submit_evidence':
        return await submit_evidence(params, userId, id);
      case 'get_task_status':
        return await get_task_status(params, userId, id);
      case 'verify_task':
        return await verify_task(params, userId, id);
      default:
        return {
          jsonrpc: "2.0",
          error: { code: -32601, message: "Method not found" },
          id
        };
    }
  } catch (error: any) {
    return {
      jsonrpc: "2.0",
      error: { code: -32603, message: error.message || "Internal error" },
      id
    };
  }
}

/**
 * 1. create_task
 */
async function create_task(params: any, userId: string, id: any): Promise<JsonRpcResponse> {
  const { title, instructions, reward_usdc, location, expiry_hours = 24 } = params;

  if (!title || !instructions || reward_usdc <= 0) {
    return {
      jsonrpc: "2.0",
      error: { code: -32602, message: "Invalid params" },
      id
    };
  }

  const expires_at = new Date();
  expires_at.setHours(expires_at.getHours() + expiry_hours);

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      created_by: userId,
      title,
      description: instructions,
      reward_amount: reward_usdc,
      reward_token: 'USDC', // Default for now
      geo_lat: location?.lat,
      geo_long: location?.long,
      expires_at: expires_at.toISOString(),
      status: 'OPEN'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    jsonrpc: "2.0",
    result: {
      task_id: data.id,
      status: data.status,
      created_at: data.created_at
    },
    id
  };
}

/**
 * 2. submit_evidence
 */
async function submit_evidence(params: any, userId: string, id: any): Promise<JsonRpcResponse> {
  const { task_id, evidence_url, notes, metadata } = params;

  // Security Audit Fix: Manually check ownership/assignment to prevent IDOR
  const { data: taskCheck, error: checkError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', task_id)
    .or(`agent_id.eq.${userId},assigned_human_id.eq.${userId}`)
    .single();

  if (checkError || !taskCheck) {
    return {
      jsonrpc: "2.0",
      error: { code: -32603, message: "Unauthorized or task not found" },
      id
    };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({
      evidence_data: { evidence_url, notes, metadata },
      status: 'SUBMITTED'
    })
    .eq('id', task_id)
    .select()
    .single();

  if (error) throw error;

  return {
    jsonrpc: "2.0",
    result: {
      task_id: data.id,
      status: data.status,
      updated_at: data.updated_at
    },
    id
  };
}

/**
 * 3. get_task_status
 */
async function get_task_status(params: any, userId: string, id: any): Promise<JsonRpcResponse> {
  const { task_id } = params;

  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, assigned_to, evidence_data')
    .eq('id', task_id)
    .single();

  if (error) throw error;

  return {
    jsonrpc: "2.0",
    result: {
      task_id: data.id,
      status: data.status,
      worker_id: data.assigned_to,
      evidence: data.evidence_data
    },
    id
  };
}

/**
 * 4. verify_task
 */
async function verify_task(params: any, userId: string, id: any): Promise<JsonRpcResponse> {
  const { task_id, verdict, feedback } = params;

  // Security Audit Fix: Manually check ownership/assignment to prevent IDOR
  const { data: taskCheck, error: checkError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', task_id)
    .or(`agent_id.eq.${userId},assigned_human_id.eq.${userId}`)
    .single();

  if (checkError || !taskCheck) {
    return {
      jsonrpc: "2.0",
      error: { code: -32603, message: "Unauthorized or task not found" },
      id
    };
  }

  const status = verdict === 'APPROVE' ? 'VERIFIED' : 'OPEN';
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      status,
      // Logic could be added here to store feedback in evidence_data or a separate field
    })
    .eq('id', task_id)
    .select()
    .single();

  if (error) throw error;

  return {
    jsonrpc: "2.0",
    result: {
      task_id: data.id,
      status: data.status,
      payment_queued: status === 'VERIFIED'
    },
    id
  };
}
