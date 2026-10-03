# RTK — Rust Token Killer

> Leia **PRIMEIRO** o [`CLAUDE.md` da raiz](../../CLAUDE.md) — as regras **R1–R15** valem aqui também.
> Este documento é dono de: **como usar o `rtk`** neste repositório.
> Verificado em **2026-10-03**, pelo **sub-chat da Fase 1 da memória compartilhada**, contra o
> `CLAUDE.md` da raiz no commit `d543f16`.

| | |
|---|---|
| **Por que este arquivo existe** | 29 linhas de manual de ferramenta eram lidas no início de **toda** sessão. **Ferramenta não é regra** |
| ⬜ **O que NÃO foi verificado** | **que o `rtk` esteja instalado e funcionando** na máquina de quem lê. Esta fase não executou nenhum comando `rtk`. O texto é fiel à raiz; **a instalação se prova rodando `rtk --version`**, que é o que a própria seção de verificação abaixo manda fazer |

---

**Byte-idêntico ao que estava no `CLAUDE.md` da raiz** (commit `d543f16`):

# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)

Refer to CLAUDE.md for full command reference.

---

> ⚠️ **Uma incoerência que veio junto, e não se conserta aqui:** a última linha do bloco diz
> *“Refer to CLAUDE.md for full command reference”* — **e a referência completa era este próprio
> bloco, no `CLAUDE.md`.** O ponteiro apontava para si mesmo. Fica registrado; **mudar o texto não é
> escopo desta fase** (ela move, não reescreve).
