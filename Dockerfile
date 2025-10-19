# ===== build =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . ./
RUN dotnet restore
RUN dotnet publish -c Release -o /app/out

# ===== runtime =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
# Render espera que o app escute em 0.0.0.0:$PORT (padrão 10000)
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
COPY --from=build /app/out ./
EXPOSE 10000
CMD ["dotnet", "TarefasApp.dll"]
