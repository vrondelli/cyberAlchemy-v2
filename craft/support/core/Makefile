# Submodule discipline helpers — see SUBMODULE-DISCIPLINE.md
REMOTE ?= origin
TARGET_BRANCH ?= master

.PHONY: bootstrap config status sync publication-check bump-check doctor ci-contract-check help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-20s %s\n", $$1, $$2}'

bootstrap: ## First-time setup after clone (init recursive + config)
	git submodule update --init --recursive
	$(MAKE) config

config: ## Set repo-standard Git safety config (per clone, local)
	git config submodule.recurse true
	git config status.submoduleSummary true
	git config diff.submodule log
	git config push.recurseSubmodules check
	git config pull.ff only
	git config merge.ff only
	@echo "repository Git config set."

status: ## Show submodule drift vs recorded pointers
	git submodule status --recursive
	@echo "---"
	git status --short

sync: ## Pull each submodule to the tip of its tracked branch
	git submodule update --remote --recursive
	@echo "Submodules moved to their tracked-branch tips. Review, then 'make bump-check'."

publication-check: ## Verify a clean, merge-free fast-forward publication delta
	@set -eu; \
		remote='$(REMOTE)'; \
		target='$(TARGET_BRANCH)'; \
		git remote get-url "$$remote" >/dev/null 2>&1 \
			|| { echo "BLOCKED: remote '$$remote' does not exist."; exit 1; }; \
		git check-ref-format "refs/heads/$$target" >/dev/null 2>&1 \
			|| { echo "BLOCKED: invalid target branch '$$target'."; exit 1; }; \
		dirty="$$(git -c submodule.recurse=false status --porcelain=v1 --untracked-files=all --ignore-submodules=none)"; \
		if test -n "$$dirty"; then \
			echo "BLOCKED: publication checks must run from a clean isolated worktree."; \
			printf '%s\n' "$$dirty"; \
			exit 1; \
		fi; \
		target_ref="refs/remotes/$$remote/$$target"; \
		git -c submodule.recurse=false fetch --no-tags --no-recurse-submodules "$$remote" \
			"refs/heads/$$target:$$target_ref"; \
		if ! git merge-base --is-ancestor "$$target_ref" HEAD; then \
			echo "BLOCKED: HEAD is not based on fresh $$remote/$$target."; \
			echo "Rebase unpublished topic work or cherry-pick scoped commits onto $$target_ref."; \
			exit 1; \
		fi; \
		merges="$$(git rev-list --merges "$$target_ref"..HEAD)"; \
		if test -n "$$merges"; then \
			echo "BLOCKED: publication delta contains merge commits:"; \
			git log --oneline --merges "$$target_ref"..HEAD; \
			exit 1; \
		fi; \
		git diff --check "$$target_ref"..HEAD; \
		echo "Publication commits:"; \
		git log --oneline "$$target_ref"..HEAD; \
		echo "Publication paths:"; \
		git diff --stat "$$target_ref"..HEAD; \
		echo "OK: HEAD is a clean, merge-free fast-forward of $$remote/$$target."

bump-check: ## Verify submodule commits are pushed before bumping the parent
	@git push --recurse-submodules=check --dry-run >/dev/null 2>&1 \
		&& echo "OK: all referenced submodule commits are pushed; safe to commit + push the parent gitlink." \
		|| { echo "BLOCKED: unpushed submodule commits — push the submodule first."; exit 1; }

doctor: ## Diagnose detached HEADs / dirty submodules / orphaned gitlinks
	@echo "== branch / detached =="
	@git config -f .gitmodules --get-regexp path | awk '{print $$2}' | while read p; do \
		echo "  $$p: $$(git -C "$$p" symbolic-ref -q --short HEAD 2>/dev/null || echo DETACHED@$$(git -C "$$p" rev-parse --short HEAD 2>/dev/null))"; \
	done
	@echo "== dirty submodules =="
	@git config -f .gitmodules --get-regexp path | awk '{print $$2}' | while read p; do \
		test -z "$$(git -C "$$p" status --porcelain 2>/dev/null)" || echo "  $$p DIRTY"; \
	done
	@echo "== orphaned gitlinks (committed in tree, NOT declared in .gitmodules) =="
	@git ls-files -s | awk '$$1==160000{print $$4}' | while read p; do \
		git config -f .gitmodules --get-regexp path 2>/dev/null | awk '{print $$2}' | grep -qx "$$p" \
		|| echo "  ORPHAN: $$p"; \
	done
	@echo "(clean if nothing listed under dirty / orphan)"

ci-contract-check: ## Validate GitHub workflow setup and dependency boundaries
	python3 tools/validate_ci_contract.py
