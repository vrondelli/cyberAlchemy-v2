// Array-based presentation DTOs. Open questions: unity-ui/PLAN.md.
using System;

namespace RobotWorld
{
    [Serializable] public sealed class SessionManifest
    {
        public string schemaVersion, fileName, sha256, sourceReplaySha256, sourceCatalogSha256;
        public int byteCount, frameCount;
    }
    [Serializable] public sealed class SessionData
    {
        public string schemaVersion, mode, provenance, sourceReplaySha256, sourceCatalogSha256;
        public FrameData[] frames;
        public CapabilityData[] catalog;
    }
    [Serializable] public sealed class FrameData
    {
        public int tick, revision, built, resource, stock;
        public string worldId;
        public string[] knowledge;
        public RobotData[] robots;
    }
    [Serializable] public sealed class RobotData
    {
        public string id, owner;
        public int energy, cargo;
        public double[] position, memory, prior;
    }
    [Serializable] public sealed class CapabilityData
    {
        public string capabilityId, version, kind, artifactType, domain, effect;
        public int byteCount;
        public string[] contributors, consumers;
    }
}
