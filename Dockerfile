FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true
ENV NODE_ENV=production

# Run the Playwright test suite during image build so the dashboard and HTML report
# are immediately populated on startup.
RUN npx playwright test --workers=1

EXPOSE 10000

CMD ["node", "server.js"]

