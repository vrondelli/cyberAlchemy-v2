/** Python ledger needs tool lookup and locale, never merchant/auth credentials. */
export function childEnvironment(){
  return {PATH:'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',
    PYTHONDONTWRITEBYTECODE:'1',TMPDIR:process.env.KELD_SCRATCH_DIR??'/tmp'};
}
