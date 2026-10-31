# GitFlow vs Trunk-based: Comparación de flujos de ramas

Gitflow es un modelo de ramificación creado en 2010 que usa varias ramas de larga vida: `main` para producción, `develop` para integración, y ramas adicionales como `release/x` y `hotfix/x`. Funciona bien cuando el equipo maneja releases versionados formales, con ciclos de QA largos y necesidad de mantener varias versiones en paralelo.

Trunk-based development, en cambio, usa una sola rama principal `main`, que siempre está lista para desplegarse. Las ramas que se crean son de corta duración y se integran rápido mediante Pull Requests pequeños.

## Conclusión

Para una aplicación web, yo elegiría **trunk-based development**, porque permite integrar cambios constantemente, reduce el riesgo de conflictos grandes al fusionar, y se alinea con un flujo de despliegue continuo.
