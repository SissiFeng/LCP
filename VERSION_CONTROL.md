# LCP Version Control Strategy

## Version Numbering

We follow Semantic Versioning (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

## Component Versioning

### Core Components
- LCP Core (`core/`)
- Protocol Adapters (`adapters/`)
- API Layer (`api/`)

### Device Templates
- Interface Templates (`templates/device/`)
- Test Templates (`templates/tests/`)
- Example Implementations (`templates/examples/`)

### Documentation
- Specifications (`docs/spec/`)
- Integration Guides
- Migration Guides

## Version Control Guidelines

### 1. Branch Strategy

```
main
├── develop
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   └── docs/doc-description
└── release/vX.Y.Z
    └── hotfix/fix-description
```

### 2. Branch Naming

- Feature branches: `feature/short-description`
- Bug fixes: `bugfix/issue-number-description`
- Documentation: `docs/topic-name`
- Releases: `release/vX.Y.Z`
- Hotfixes: `hotfix/issue-number-description`

### 3. Commit Messages

Format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### 4. Version Bumping

When to bump versions:

1. **MAJOR**:
   - Breaking API changes
   - Incompatible protocol changes
   - Major architectural changes

2. **MINOR**:
   - New features
   - New device templates
   - Optional capability additions

3. **PATCH**:
   - Bug fixes
   - Documentation updates
   - Minor improvements

### 5. Release Process

1. Create release branch
2. Update version numbers
3. Update CHANGELOG.md
4. Run test suite
5. Create release tag
6. Merge to main
7. Update develop

### 6. Documentation Updates

With each release:
1. Update API documentation
2. Update migration guides
3. Update example implementations
4. Review and update templates

### 7. Backward Compatibility

- Maintain compatibility within MAJOR versions
- Document breaking changes
- Provide migration paths
- Keep old versions accessible

### 8. Testing Requirements

Before version changes:
1. Run full test suite
2. Test example implementations
3. Validate all templates
4. Check documentation accuracy

## Version History

### Current Stable Version
- v1.0.0: Initial stable release

### Development Version
- v1.1.0-dev: Current development version

## Migration Support

- Support latest two MAJOR versions
- Provide migration scripts
- Document breaking changes
- Maintain legacy documentation 
