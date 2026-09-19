FROM domainspec-node-toolchain:26.8.1-ts7.0.2
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv --system-site-packages /opt/validation-python && /opt/validation-python/bin/pip install --no-cache-dir jsonschema==4.26.0
ENV PATH=/opt/validation-python/bin:${PATH}
