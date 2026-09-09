// Desktop-only local fixture loader; hashes identify content, not KEP trust.
// Unity compilation remains unverified until the editor is available.
// Open questions: unity-ui/PLAN.md.
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace RobotWorld
{
    public static class SessionLoader
    {
        const int MaxBytes = 16 * 1024 * 1024;

        public static SessionData LoadDirectory(string directory)
        {
            var manifestBytes = ReadBounded(Path.Combine(directory, "session-manifest.json"), 16384);
            var manifest = JsonUtility.FromJson<SessionManifest>(Encoding.UTF8.GetString(manifestBytes));
            Require(manifest != null && manifest.schemaVersion == "robot-world.unity-session-manifest/v1-prototype",
                "Unsupported session manifest");
            Require(manifest.fileName == "session.json", "Unsupported session file name");
            Require(manifest.byteCount > 0 && manifest.byteCount <= MaxBytes, "Session size is invalid");
            var bytes = ReadBounded(Path.Combine(directory, "session.json"), MaxBytes);
            Require(bytes.Length == manifest.byteCount, "Session byte count mismatch");
            string actual;
            using (var sha = SHA256.Create())
                actual = BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
            Require(actual == manifest.sha256, "Session content hash mismatch");
            var data = JsonUtility.FromJson<SessionData>(Encoding.UTF8.GetString(bytes));
            Validate(data);
            Require(data.frames.Length == manifest.frameCount, "Session frame count mismatch");
            Require(data.sourceReplaySha256 == manifest.sourceReplaySha256 &&
                    data.sourceCatalogSha256 == manifest.sourceCatalogSha256, "Source identity mismatch");
            return data;
        }

        static byte[] ReadBounded(string path, int limit)
        {
            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                Require(stream.Length > 0 && stream.Length <= limit, "File size is invalid");
                var bytes = new byte[(int)stream.Length];
                int read = 0;
                while (read < bytes.Length)
                {
                    int n = stream.Read(bytes, read, bytes.Length - read);
                    if (n == 0) throw new InvalidDataException("Truncated session file");
                    read += n;
                }
                return bytes;
            }
        }

        public static void Validate(SessionData data)
        {
            Require(data != null && data.schemaVersion == "robot-world.unity-session/v1-prototype", "Unsupported session");
            Require(data.mode == "recorded-scripted-policy", "Unsupported session mode");
            Require(IsHash(data.sourceReplaySha256) && IsHash(data.sourceCatalogSha256), "Missing source identity");
            Require(data.frames != null && data.frames.Length > 0 && data.frames.Length <= 100000, "Invalid frames");
            int tick = -1, revision = -1;
            string world = null;
            Dictionary<string, string> identities = null;
            foreach (var frame in data.frames)
            {
                Require(frame != null, "Missing frame");
                Require(frame.tick >= tick && frame.revision > revision, "Non-monotonic frame sequence");
                Require(frame.tick >= 0 && frame.built >= 0 && frame.resource >= 0 && frame.stock >= 0, "Invalid world counters");
                Require(!String.IsNullOrWhiteSpace(frame.worldId), "Missing world identity");
                Require(world == null || world == frame.worldId, "Mixed world session");
                Require(frame.knowledge != null, "Missing knowledge array");
                Require(frame.robots != null && frame.robots.Length > 0, "Missing agents");
                var current = new Dictionary<string, string>(StringComparer.Ordinal);
                foreach (var robot in frame.robots)
                {
                    Require(robot != null && !String.IsNullOrWhiteSpace(robot.id) && !String.IsNullOrWhiteSpace(robot.owner), "Missing agent identity");
                    Require(!current.ContainsKey(robot.id), "Duplicate agent identity");
                    current.Add(robot.id, robot.owner);
                    Require(robot.energy >= 0 && robot.energy <= 100 && robot.cargo >= 0, "Invalid agent counters");
                    CheckVector(robot.position, 2);
                    Require(robot.memory != null && robot.memory.Length > 0 && robot.memory.Length <= 128, "Invalid memory dimensions");
                    CheckVector(robot.memory, robot.memory.Length);
                    CheckVector(robot.prior, robot.memory.Length);
                }
                if (identities != null)
                {
                    Require(current.Count == identities.Count, "Agent set changed");
                    foreach (var pair in identities)
                        Require(current.TryGetValue(pair.Key, out var owner) && owner == pair.Value, "Agent owner changed");
                }
                identities = current;
                tick = frame.tick; revision = frame.revision; world = frame.worldId;
            }
            Require(data.catalog != null, "Missing catalog; do not substitute another session's catalog");
            var versions = new HashSet<string>(StringComparer.Ordinal);
            foreach (var capability in data.catalog)
            {
                Require(capability != null && !String.IsNullOrWhiteSpace(capability.capabilityId), "Missing capability identity");
                Require(IsHash(capability.version), "Invalid capability version");
                Require(versions.Add(capability.capabilityId + "\n" + capability.version), "Duplicate capability version");
                Require(capability.byteCount >= 0 && capability.contributors != null && capability.consumers != null, "Invalid capability metadata");
            }
        }

        static void CheckVector(double[] vector, int length)
        {
            Require(vector != null && vector.Length == length, "Vector dimensions differ");
            foreach (double value in vector)
                Require(!Double.IsNaN(value) && !Double.IsInfinity(value), "Non-finite vector component");
        }
        static bool IsHash(string value)
        {
            if (value == null || value.Length != 64) return false;
            foreach (char c in value) if (!(c >= '0' && c <= '9') && !(c >= 'a' && c <= 'f')) return false;
            return true;
        }
        static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidDataException(message);
        }
    }
}
