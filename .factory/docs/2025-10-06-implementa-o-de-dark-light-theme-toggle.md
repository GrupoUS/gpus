# Análise da Implementação de Dark/Light Theme Toggle

## Status Atual ❌

O sistema de dark/light theme **NÃO está funcional** no projeto AegisWallet:

### ✅ Configurações Prontas (Infraestrutura OK)
- **Tailwind Config**: `darkMode: ['class']` configurado
- **CSS Variables**: Variáveis de tema definidas em `:root` e `.dark` no `index.css`
- **Dependência**: `next-themes@0.4.6` instalado

### ❌ Componentes Faltando (Sistema Não Funcional)
1. **ThemeProvider**: Não existe no projeto
   - Necessário para gerenciar estado do tema
   - Sem provider, o `useTheme()` não funciona
   
2. **ModeToggle**: Não existe componente UI para alternar temas
   - Usuário não tem forma de trocar entre light/dark/system
   
3. **App.tsx**: Não está envolto pelo ThemeProvider
   - `<AccessibilityProvider>` está wrapeando, mas falta `<ThemeProvider>`
   
4. **Bug no Sonner**: `src/components/ui/sonner.tsx` importa `useTheme` de "next-themes"
   - ⚠️ Vai quebrar em runtime pois não há provider

## 📋 Implementação Necessária

Seguindo a [documentação oficial shadcn para Vite](https://ui.shadcn.com/docs/dark-mode/vite):

### 1. Criar ThemeProvider
**Arquivo**: `src/components/providers/ThemeProvider.tsx`
- Context para gerenciar estado do tema (dark/light/system)
- Hook `useTheme()` para componentes consumirem
- Sincronizar com localStorage
- Aplicar classe `.dark` no `<html>`

### 2. Criar ModeToggle Component
**Arquivo**: `src/components/ui/mode-toggle.tsx`
- Dropdown com 3 opções: Light, Dark, System
- Ícones de sol/lua com animação
- Usar `useTheme()` do ThemeProvider

### 3. Atualizar App.tsx
Envolver aplicação com ThemeProvider:
```tsx
<ThemeProvider defaultTheme="system" storageKey="aegiswallet-theme">
  <AccessibilityProvider>
    <RouterProvider router={router} />
  </AccessibilityProvider>
</ThemeProvider>
```

### 4. Adicionar Toggle na UI
Integrar `<ModeToggle />` em locais estratégicos (header/sidebar)

## 🎯 Resultado Esperado

Após implementação:
- ✅ Usuário poderá alternar entre light/dark/system
- ✅ Preferência salva em localStorage
- ✅ Componente Sonner funcionará corretamente
- ✅ Todos componentes shadcn respeitarão o tema escolhido
- ✅ Suporte a tema do sistema operacional

## 📦 Dependências

Nenhuma nova dependência necessária - `next-themes` já está instalado.

---

**Pronto para implementar?** Posso criar todos os arquivos necessários seguindo as melhores práticas do shadcn/ui.