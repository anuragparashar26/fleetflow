// Notification Service (Supabase)
import supabase from "../../../utils/supabaseClient.js";

export const createNotification = async ({ workspace_id, recipient_id, type, title, message, entity_type, entity_id }) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert([{ workspace_id, recipient_id, type, title, message, entity_type, entity_id }]);
    
    if (error) throw error;
    return data;
};