import React, { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MotionProps, Variants } from 'framer-motion'

// Common animation variants
export const fadeInVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
}

export const slideInVariants: Variants = {
  hidden: { 
    x: -100,
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
}

export const scaleInVariants: Variants = {
  hidden: { 
    scale: 0.8,
    opacity: 0
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

export const staggerChildrenVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const childVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

// Micro-interaction variants
export const buttonHoverVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95
  }
}

export const cardHoverVariants: Variants = {
  hover: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
}

export const iconSpinVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: "linear",
      repeat: Infinity
    }
  }
}

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
}

// Animation wrapper components
interface AnimatedContainerProps extends MotionProps {
  children: ReactNode
  variant?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'stagger'
  className?: string
  delay?: number
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  variant = 'fadeIn',
  className = '',
  delay = 0,
  ...motionProps
}) => {
  const getVariants = () => {
    switch (variant) {
      case 'slideIn':
        return slideInVariants
      case 'scaleIn':
        return scaleInVariants
      case 'stagger':
        return staggerChildrenVariants
      default:
        return fadeInVariants
    }
  }

  return (
    <motion.div
      className={className}
      variants={getVariants()}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ willChange: 'transform, opacity' }}
      transition={{ delay }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  staggerDelay = 0.1
}) => {
  return (
    <motion.div
      className={className}
      variants={staggerChildrenVariants}
      initial="hidden"
      animate="visible"
      style={{ willChange: 'transform, opacity' }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={childVariants}
          style={{ willChange: 'transform, opacity' }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

interface AnimatedButtonProps extends MotionProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...motionProps
}) => {
  const baseClasses = "tw-inline-flex tw-items-center tw-justify-center tw-font-medium tw-rounded-lg tw-transition-colors tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-offset-2"
  
  const variantClasses = {
    primary: "tw-bg-primary tw-text-white hover:tw-bg-primary/90 tw-focus:ring-primary",
    secondary: "tw-bg-secondary tw-text-white hover:tw-bg-secondary/90 tw-focus:ring-secondary",
    outline: "tw-border tw-border-border tw-bg-transparent hover:tw-bg-surface tw-focus:ring-primary"
  }
  
  const sizeClasses = {
    sm: "tw-px-3 tw-py-1.5 tw-text-sm",
    md: "tw-px-4 tw-py-2 tw-text-sm",
    lg: "tw-px-6 tw-py-3 tw-text-base"
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'tw-opacity-50 tw-cursor-not-allowed' : ''}`

  return (
    <motion.button
      className={classes}
      variants={buttonHoverVariants}
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ willChange: 'transform' }}
      {...motionProps}
    >
      {children}
    </motion.button>
  )
}

interface AnimatedCardProps extends MotionProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  ...motionProps
}) => {
  const baseClasses = "tw-bg-surface tw-border tw-border-border tw-rounded-lg tw-p-6 tw-shadow-sm"
  const hoverClasses = hoverable ? "tw-cursor-pointer" : ""
  const classes = `${baseClasses} ${hoverClasses} ${className}`

  return (
    <motion.div
      className={classes}
      variants={hoverable ? cardHoverVariants : undefined}
      whileHover={hoverable ? "hover" : undefined}
      onClick={onClick}
      style={{ willChange: 'transform, box-shadow' }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = ''
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={window.location.pathname}
        className={className}
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading animation component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'tw-h-4 tw-w-4',
    md: 'tw-h-8 tw-w-8',
    lg: 'tw-h-12 tw-w-12'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} tw-border-2 tw-border-border tw-border-t-primary tw-rounded-full ${className}`}
      variants={iconSpinVariants}
      animate="spin"
      style={{ willChange: 'transform' }}
    />
  )
}

// Floating action button with pulse animation
interface FloatingActionButtonProps {
  onClick: () => void
  children: ReactNode
  className?: string
  pulse?: boolean
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  children,
  className = '',
  pulse = false
}) => {
  const baseClasses = "tw-fixed tw-bottom-6 tw-right-6 tw-bg-primary tw-text-white tw-p-4 tw-rounded-full tw-shadow-lg tw-cursor-pointer tw-z-50"
  const classes = `${baseClasses} ${className}`

  return (
    <motion.div
      className={classes}
      variants={pulse ? pulseVariants : buttonHoverVariants}
      animate={pulse ? "pulse" : undefined}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}

export default {
  AnimatedContainer,
  AnimatedList,
  AnimatedButton,
  AnimatedCard,
  PageTransition,
  LoadingSpinner,
  FloatingActionButton,
  fadeInVariants,
  slideInVariants,
  scaleInVariants,
  staggerChildrenVariants,
  childVariants,
  buttonHoverVariants,
  cardHoverVariants,
  iconSpinVariants,
  pulseVariants
}