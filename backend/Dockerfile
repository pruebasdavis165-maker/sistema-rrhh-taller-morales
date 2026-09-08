# Etapa 1: Build de la solución .NET 9
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias para aprovechar cache de Docker
COPY ["src/TornoMorales.Domain/TornoMorales.Domain.csproj", "src/TornoMorales.Domain/"]
COPY ["src/TornoMorales.Application/TornoMorales.Application.csproj", "src/TornoMorales.Application/"]
COPY ["src/TornoMorales.Infrastructure/TornoMorales.Infrastructure.csproj", "src/TornoMorales.Infrastructure/"]
COPY ["src/TornoMorales.Api/TornoMorales.Api.csproj", "src/TornoMorales.Api/"]

RUN dotnet restore "src/TornoMorales.Api/TornoMorales.Api.csproj"

# Copiar todo el código fuente y compilar
COPY . .
WORKDIR "/src/src/TornoMorales.Api"
RUN dotnet publish "TornoMorales.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa 2: Runtime optimizado
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TornoMorales.Api.dll"]
