FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

ENV CI=true
ENV RENDER=true

RUN mkdir -p test-results playwright-report && \
    { npx playwright --version && npx playwright test --workers=1; } > test-results/build.log 2>&1 || true; \
    tail -n 60 test-results/build.log

EXPOSE 10000

CMD ["node", "server.js"]
