import { describe, it, expect } from 'vitest';
import { DotnetAnalyzer } from '../../../../src/detection/analyzers/dotnet.js';

describe('DotnetAnalyzer', () => {
  const analyzer = new DotnetAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('dotnet');
    expect(analyzer.name).toBe('.NET');
    expect(analyzer.filePatterns).toContain('*.csproj');
    expect(analyzer.filePatterns).toContain('*.sln');
    expect(analyzer.filePatterns).toContain('*.fsproj');
  });

  it('should return empty result when no .NET files found', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect C# from .csproj file', async () => {
    const files = new Map<string, string>();
    files.set('MyApp.csproj', `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const csharp = result.technologies.find((t) => t.id === 'csharp');
    expect(csharp).toBeDefined();
    expect(csharp!.confidence).toBe(95);
    expect(csharp!.profileIds).toContain('languages/csharp');
    expect(csharp!.version).toBe('net8.0');
    expect(csharp!.majorVersion).toBe(8);
    expect(result.analyzedFiles).toContain('MyApp.csproj');
  });

  it('should detect F# from .fsproj file', async () => {
    const files = new Map<string, string>();
    files.set('MyApp.fsproj', `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net7.0</TargetFramework>
  </PropertyGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const fsharp = result.technologies.find((t) => t.id === 'fsharp');
    expect(fsharp).toBeDefined();
    expect(fsharp!.confidence).toBe(95);
    expect(fsharp!.version).toBe('net7.0');
  });

  it('should detect ASP.NET Core from Web SDK', async () => {
    const files = new Map<string, string>();
    files.set('WebApp.csproj', `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const aspnet = result.technologies.find((t) => t.id === 'aspnet');
    expect(aspnet).toBeDefined();
    expect(aspnet!.confidence).toBe(90);
  });

  it('should detect ASP.NET Core from package reference', async () => {
    const files = new Map<string, string>();
    files.set('WebApp.csproj', `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const aspnet = result.technologies.find((t) => t.id === 'aspnet');
    expect(aspnet).toBeDefined();
  });

  it('should not duplicate C# when multiple .csproj files exist', async () => {
    const files = new Map<string, string>();
    files.set('App.csproj', '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>');
    files.set('Tests.csproj', '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>');
    const result = await analyzer.analyze(files, '/project');

    const csharpCount = result.technologies.filter((t) => t.id === 'csharp').length;
    expect(csharpCount).toBe(1);
    expect(result.analyzedFiles).toHaveLength(2);
  });

  it('should track .sln files in analyzedFiles', async () => {
    const files = new Map<string, string>();
    files.set('MyApp.sln', 'Microsoft Visual Studio Solution File');
    const result = await analyzer.analyze(files, '/project');

    expect(result.analyzedFiles).toContain('MyApp.sln');
  });

  it('should handle malformed .csproj XML gracefully', async () => {
    const files = new Map<string, string>();
    files.set('Bad.csproj', 'this is not valid xml {{{');
    const result = await analyzer.analyze(files, '/project');

    // Should still detect C# (from file extension) but not crash
    const csharp = result.technologies.find((t) => t.id === 'csharp');
    expect(csharp).toBeDefined();
    expect(result.analyzedFiles).toContain('Bad.csproj');
  });

  it('should detect version from netcoreapp3.1 target framework', async () => {
    const files = new Map<string, string>();
    files.set('OldApp.csproj', `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const csharp = result.technologies.find((t) => t.id === 'csharp');
    expect(csharp).toBeDefined();
    expect(csharp!.version).toBe('netcoreapp3.1');
    expect(csharp!.majorVersion).toBe(3);
  });

  it('should pick highest version from multi-target frameworks', async () => {
    const files = new Map<string, string>();
    files.set('MultiTarget.csproj', `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net6.0;net8.0</TargetFrameworks>
  </PropertyGroup>
</Project>`);
    const result = await analyzer.analyze(files, '/project');

    const csharp = result.technologies.find((t) => t.id === 'csharp');
    expect(csharp).toBeDefined();
    expect(csharp!.majorVersion).toBe(8);
    expect(csharp!.version).toBe('net8.0');
  });

  it('should only include relevant files in analyzedFiles', async () => {
    const files = new Map<string, string>();
    files.set('App.csproj', '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>');
    files.set('package.json', '{}');
    const result = await analyzer.analyze(files, '/project');

    expect(result.analyzedFiles).toContain('App.csproj');
    expect(result.analyzedFiles).not.toContain('package.json');
  });
});
