# WSL backing-volume correction

Ubuntu is registered at `D:\WSL\Ubuntu`, with virtual disk `ext4.vhdx`. This was verified through the Windows Lxss registry on 2026-09-18. The physical backing volume is `/mnt/d`; `/mnt/c` is not the backing volume for this distribution. Guest filesystem free space is a separate measurement.

The existing benchmark wrappers incorrectly hard-code `/mnt/c`. Their historical checks remain evidence of what ran, but do not establish D: capacity. The newly prepared LongMemEval freeze is held and must not be dispatched. Before either benchmark resumes, create a reviewed successor with the verified D: host binding, the unchanged host/guest reserve policy, evidence-growth admission, and tests that reject the wrong host. Preserve the old freeze instead of silently changing its bound source files.

Cleanup removes only verified regenerable caches. Actual D: free space must be measured after TRIM or compaction; deletion inside ext4 alone does not prove physical reclamation. No C: files were removed.

## Open Questions

Can online TRIM reclaim the deleted ext4 blocks on this VHD? If offline compaction is necessary, the user must schedule it after ending active WSL work; do not shut down this running workspace automatically. Correctly bound benchmark successor implementation and independent review remain prerequisites.
