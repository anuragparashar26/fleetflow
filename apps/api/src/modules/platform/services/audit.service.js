// Audit logging Service (Supabase)
import supabase from "../../../utils/supabaseClient.js";

export const logEvent = async ({ workspace_id, actor_id, entity_type, entity_id, action, old_values, new_values }) => {
    const { data, error } = await supabase
        .from('audit_events')
        .insert([{ workspace_id, actor_id, entity_type, entity_id, action, old_values, new_values }]);
    
    if (error) throw error;
    return data;
};