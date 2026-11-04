FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN cp -r src/* . 2>/dev/null || true
RUN dotnet restore "TornoMorales.Api/TornoMorales.Api.csproj"
RUN dotnet publish "TornoMorales.Api/TornoMorales.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y libfontconfig1 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
# Dejar que Railway/Plataforma asigne el puerto dinámico
ENTRYPOINT ["dotnet", "TornoMorales.Api.dll"]
