# Local secrets (gitignored)

Put these files in this folder. Git ignores everything here except this README.

| File | Purpose |
|---|---|
| `dev_key` | SSH key for `web_deploy@DEVHUBPOINT01` |
| `prod_key` | SSH key for `web_deploy@PRODHUBPOINT01` |
| `mgmt_key` | SSH key for `root@MGMTHUBPOINT01` |
| `.env` | Registry + host settings used by `Deploy-CodeMuscle.ps1` |
| `env.deploy` | Server `DEPLOY_DATABASE_URL` backup (`DATABASE_URL` for Compose) |
| `ssh.config` | Generated OpenSSH config (script overwrites this) |

Copy keys from `%USERPROFILE%\.ssh_hubpoint\` if this folder is empty.
Do not commit this directory.
