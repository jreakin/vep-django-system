import React from 'react'
import type { ReactNode } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Collapse,
  Avatar,
  Divider,
  Chip,
  Badge,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  AccountBalance as BillingIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Api as IntegrationsIcon,
  Analytics as AnalyticsIcon,
  LocationOn as TerritoryIcon,
  HowToVote as CanvassingIcon,
  AccountTree as RedistrictingIcon,
  ExpandLess,
  ExpandMore,
  Notifications,
  Search,
  Settings,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { logout } from '../store/authSlice'
import NotificationCenter from './NotificationCenter'

const drawerWidth = 280

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [openMenus, setOpenMenus] = React.useState<{[key: string]: boolean}>({})
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuToggle = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }))
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { text: 'Voter Data', icon: <PeopleIcon />, path: '/voter-data' },
    { text: 'Billing', icon: <BillingIcon />, path: '/billing' },
    { 
      text: 'Canvassing', 
      icon: <CanvassingIcon />, 
      path: '/canvassing',
      subItems: [
        { text: 'Walk Lists', path: '/canvassing' },
        { text: 'Sessions', path: '/canvassing/sessions' },
        { text: 'Questionnaires', path: '/canvassing/questionnaires' }
      ]
    },
    { 
      text: 'Redistricting', 
      icon: <RedistrictingIcon />, 
      path: '/redistricting',
      subItems: [
        { text: 'Plan Manager', path: '/redistricting' },
        { text: 'District Editor', path: '/redistricting/editor' },
        { text: 'Plan Comparison', path: '/redistricting/comparison' }
      ]
    },
    { 
      text: 'Territories', 
      icon: <TerritoryIcon />, 
      path: '/territories',
      subItems: [
        { text: 'Territory Manager', path: '/territories' },
        { text: 'Interactive Mapper', path: '/territories/mapper' }
      ]
    },
    { 
      text: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/analytics',
      subItems: [
        { text: 'Predictive Modeling', path: '/analytics/modeling' },
        { text: 'Report Builder', path: '/analytics/reports' }
      ]
    },
    { text: 'Integrations', icon: <IntegrationsIcon />, path: '/integrations' },
    { 
      text: 'Admin', 
      icon: <AdminIcon />, 
      path: '/admin',
      subItems: [
        { text: 'User Management', path: '/admin/users' },
        { text: 'Impersonation', path: '/admin/impersonation' },
        { text: 'Audit Logs', path: '/admin/audit-logs' }
      ]
    },
  ]

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
          CampaignManager
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Political CRM Platform
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
        <List>
          {menuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ px: 2 }}>
                  <ListItemButton 
                    onClick={() => {
                      if (item.subItems) {
                        handleMenuToggle(item.text)
                      } else {
                        navigate(item.path)
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      backgroundColor: active ? 'rgba(0, 112, 243, 0.2)' : 'transparent',
                      color: active ? '#4d94ff' : 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: active ? 'rgba(0, 112, 243, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? '#4d94ff' : 'rgba(255, 255, 255, 0.9)' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                      }}
                    />
                    {item.subItems && (
                      <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {openMenus[item.text] ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
                {item.subItems && (
                  <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => {
                        const subActive = isActive(subItem.path)
                        return (
                          <ListItem key={subItem.text} disablePadding sx={{ px: 2 }}>
                            <ListItemButton 
                              sx={{ 
                                pl: 6, 
                                borderRadius: 2,
                                mb: 0.5,
                                backgroundColor: subActive ? 'rgba(0, 112, 243, 0.2)' : 'transparent',
                                color: subActive ? '#4d94ff' : 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                  backgroundColor: subActive ? 'rgba(0, 112, 243, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                },
                              }}
                              onClick={() => navigate(subItem.path)}
                            >
                              <ListItemText 
                                primary={subItem.text}
                                primaryTypographyProps={{
                                  fontSize: '0.8125rem',
                                  fontWeight: subActive ? 600 : 400,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            )
          })}
        </List>
      </Box>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: '#0070f3' }}>
            {user?.phone_number?.charAt(1) || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Campaign Manager
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {user?.phone_number || 'User'}
            </Typography>
          </Box>
        </Box>
        <ListItemButton 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(220, 38, 38, 0.2)',
              color: '#ef4444',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: '#1a202c',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Political Campaign Management System
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="large" 
              color="inherit"
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <Search />
            </IconButton>
            
            <Badge badgeContent={3} color="error">
              <IconButton 
                size="large" 
                color="inherit"
                sx={{ 
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                }}
              >
                <Notifications />
              </IconButton>
            </Badge>
            
            <IconButton 
              size="large" 
              color="inherit"
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <Settings />
            </IconButton>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 32, alignSelf: 'center' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  Campaign Manager
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.phone_number || 'User'}
                </Typography>
              </Box>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#0070f3' }}>
                {user?.phone_number?.charAt(1) || 'U'}
              </Avatar>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#fafbfc',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout