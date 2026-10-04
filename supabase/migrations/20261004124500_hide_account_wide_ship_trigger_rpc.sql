-- This function is invoked by a PostgreSQL trigger, not by the client.
-- Remove its exposed RPC execute privilege while retaining trigger execution.
revoke execute on function public.expand_account_wide_zen_store_ship() from public;
