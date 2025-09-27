/**
 * TrustCap Design System Configuration
 *
 * This file contains all design tokens, component styles, and configuration
 * for maintaining a consistent and modern UI across the DetailDeck application.
 *
 * Based on TrustCap Design System specifications.
 */

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const designTokens = {
  // Typography
  typography: {
    fontFamily: {
      primary: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      heading: '90px',
      subHeading: '60px',
      body: '18px',
      small: '16px',
      xs: '14px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '110%',
      normal: '120%',
      relaxed: '150%',
    },
  },

  // Colors
  colors: {
    primary: '#8895F5',
    primaryLight: '#F7F7FD',
    secondary: '#88B5F5',
    neutralDark: '#000000',
    neutralLight: '#F9FAFB',
    background: '#FFFFFF',

    // Extended palette for UI components
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Spacing (multiples of 8px)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
    '5xl': '96px',
    '6xl': '120px',
  },

  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 8px rgba(0, 0, 0, 0.05)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.08)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },

  // Layout
  layout: {
    maxWidth: '1280px',
    gutter: '24px',
    sectionPadding: '80px 0',
    heroPadding: '120px 20px',
  },
};

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(90deg, #8895F5, #88B5F5)',
  hero: 'linear-gradient(180deg, #F9FAFB, #FFFFFF)',
  subtle: 'linear-gradient(135deg, #F7F7FD, #FFFFFF)',
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const componentStyles = {
  // Buttons
  buttons: {
    primary: {
      background: gradients.primary,
      color: designTokens.colors.background,
      borderRadius: designTokens.borderRadius.md,
      padding: '14px 28px',
      fontWeight: designTokens.typography.fontWeight.semiBold,
      fontSize: designTokens.typography.fontSize.small,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: designTokens.boxShadow.sm,
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: designTokens.boxShadow.md,
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '&:disabled': {
        opacity: '0.5',
        cursor: 'not-allowed',
        transform: 'none',
      },
    },

    secondary: {
      background: designTokens.colors.neutralLight,
      color: designTokens.colors.neutralDark,
      border: `1px solid ${designTokens.colors.gray[200]}`,
      borderRadius: designTokens.borderRadius.md,
      padding: '12px 24px',
      fontWeight: designTokens.typography.fontWeight.medium,
      fontSize: designTokens.typography.fontSize.small,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: designTokens.colors.gray[50],
        borderColor: designTokens.colors.gray[300],
      },
      '&:disabled': {
        opacity: '0.5',
        cursor: 'not-allowed',
      },
    },

    ghost: {
      background: 'transparent',
      color: designTokens.colors.neutralDark,
      border: 'none',
      borderRadius: designTokens.borderRadius.md,
      padding: '12px 24px',
      fontWeight: designTokens.typography.fontWeight.medium,
      fontSize: designTokens.typography.fontSize.small,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: designTokens.colors.gray[50],
      },
    },
  },

  // Cards
  cards: {
    default: {
      backgroundColor: designTokens.colors.background,
      borderRadius: designTokens.borderRadius.xl,
      boxShadow: designTokens.boxShadow.md,
      padding: designTokens.spacing.lg,
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: designTokens.boxShadow.lg,
        transform: 'translateY(-2px)',
      },
    },

    testimonial: {
      backgroundColor: designTokens.colors.background,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.boxShadow.md,
      padding: designTokens.spacing.lg,
      textAlign: 'center',
      avatarSize: '64px',
      quoteFontSize: designTokens.typography.fontSize.small,
    },

    faq: {
      backgroundColor: designTokens.colors.background,
      borderBottom: `1px solid ${designTokens.colors.gray[200]}`,
      padding: `${designTokens.spacing.md} 0`,
      questionFontWeight: designTokens.typography.fontWeight.semiBold,
      answerFontSize: designTokens.typography.fontSize.small,
    },
  },

  // Navigation
  navbar: {
    background: designTokens.colors.background,
    borderBottom: `1px solid ${designTokens.colors.gray[200]}`,
    padding: `${designTokens.spacing.md} 0`,
    links: {
      fontSize: designTokens.typography.fontSize.small,
      fontWeight: designTokens.typography.fontWeight.medium,
      color: designTokens.colors.neutralDark,
      textDecoration: 'none',
      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
      borderRadius: designTokens.borderRadius.md,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: designTokens.colors.gray[50],
      },
    },
  },

  // Sections
  sections: {
    hero: {
      background: gradients.hero,
      padding: designTokens.layout.heroPadding,
      textAlign: 'center',
      maxWidth: '960px',
      margin: '0 auto',
      headlineStyle: {
        fontSize: designTokens.typography.fontSize.heading,
        fontWeight: designTokens.typography.fontWeight.bold,
        lineHeight: designTokens.typography.lineHeight.tight,
        color: designTokens.colors.neutralDark,
        marginBottom: designTokens.spacing.lg,
      },
      subHeadlineStyle: {
        fontSize: designTokens.typography.fontSize.subHeading,
        fontWeight: designTokens.typography.fontWeight.semiBold,
        lineHeight: designTokens.typography.lineHeight.normal,
        color: designTokens.colors.neutralDark,
        marginBottom: designTokens.spacing.xl,
      },
    },

    ctaBanner: {
      background: designTokens.colors.primaryLight,
      padding: designTokens.spacing['4xl'],
      textAlign: 'center',
      borderRadius: designTokens.borderRadius.xl,
      margin: `${designTokens.spacing['4xl']} 0`,
    },
  },

  // Forms
  forms: {
    input: {
      backgroundColor: designTokens.colors.background,
      border: `1px solid ${designTokens.colors.gray[300]}`,
      borderRadius: designTokens.borderRadius.md,
      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
      fontSize: designTokens.typography.fontSize.small,
      fontFamily: designTokens.typography.fontFamily.primary,
      color: designTokens.colors.neutralDark,
      outline: 'none',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: designTokens.colors.primary,
        boxShadow: `0 0 0 3px ${designTokens.colors.primary}20`,
      },
      '&:disabled': {
        backgroundColor: designTokens.colors.gray[50],
        color: designTokens.colors.gray[500],
        cursor: 'not-allowed',
      },
    },

    label: {
      fontSize: designTokens.typography.fontSize.xs,
      fontWeight: designTokens.typography.fontWeight.medium,
      color: designTokens.colors.neutralDark,
      marginBottom: designTokens.spacing.xs,
      display: 'block',
    },

    error: {
      fontSize: designTokens.typography.fontSize.xs,
      color: designTokens.colors.error,
      marginTop: designTokens.spacing.xs,
    },
  },

  // Footer
  footer: {
    background: designTokens.colors.background,
    borderTop: `1px solid ${designTokens.colors.gray[200]}`,
    padding: `${designTokens.spacing['2xl']} 0`,
    textColor: designTokens.colors.neutralDark,
    links: {
      fontSize: designTokens.typography.fontSize.xs,
      color: designTokens.colors.gray[600],
      textDecoration: 'none',
      '&:hover': {
        color: designTokens.colors.neutralDark,
      },
    },
    socialIcons: {
      size: '20px',
      color: designTokens.colors.neutralDark,
    },
  },
};

// ============================================================================
// UTILITY CLASSES (for Tailwind CSS)
// ============================================================================

export const utilityClasses = {
  // Typography
  heading: 'text-[90px] font-bold leading-[110%] text-black',
  subHeading: 'text-[60px] font-semibold leading-[120%] text-black',
  body: 'text-lg font-normal leading-[150%] text-black',

  // Buttons
  btnPrimary: 'bg-gradient-to-r from-[#8895F5] to-[#88B5F5] text-white rounded-lg px-7 py-3.5 font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
  btnSecondary: 'bg-gray-50 text-black border border-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-200',
  btnGhost: 'bg-transparent text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-50 transition-all duration-200',

  // Cards
  card: 'bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200',

  // Layout
  container: 'max-w-[1280px] mx-auto px-6',
  section: 'py-20',
  heroSection: 'bg-gradient-to-b from-gray-50 to-white py-30 text-center',
  ctaBanner: 'bg-[#F7F7FD] p-20 text-center rounded-2xl my-20',
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
};

// ============================================================================
// STYLE GUIDELINES
// ============================================================================

export const styleGuidelines = {
  gradients: {
    description: 'Primary CTA buttons and hero backgrounds use subtle blue gradients.',
    usage: 'Use gradients sparingly for primary actions and hero sections only.',
  },
  cornerRadius: {
    description: 'Cards and buttons use medium rounding (8px - 16px).',
    small: '8px for buttons and small elements',
    medium: '12px for cards and modals',
    large: '16px for major containers',
  },
  shadows: {
    description: 'Very subtle shadows on cards for depth.',
    usage: 'Use minimal shadows to create hierarchy without overwhelming the design.',
  },
  spacing: {
    description: 'Use multiples of 8px for padding and margins.',
    rule: 'All spacing should follow the 8px grid system for consistency.',
  },
  imagery: {
    description: 'Photos are professional, corporate-style, with people or financial contexts.',
    guidelines: 'Use high-quality, professional imagery that reflects trust and reliability.',
  },
};

// ============================================================================
// EXPORT DEFAULT DESIGN SYSTEM
// ============================================================================

export const designSystem = {
  name: 'TrustCap Design System',
  tokens: designTokens,
  gradients,
  components: componentStyles,
  utilities: utilityClasses,
  breakpoints,
  animations,
  guidelines: styleGuidelines,
};

export default designSystem;





