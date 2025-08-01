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
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { logout } from '../store/authSlice'
import NotificationCenter from './NotificationCenter'

const drawerWidth = 240

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [openMenus, setOpenMenus] = React.useState<{[key: string]: boolean}>({})
  const navigate = useNavigate()
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
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          CampaignManager
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => {
                  if (item.subItems) {
                    handleMenuToggle(item.text)
                  } else {
                    navigate(item.path)
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.subItems && (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            {item.subItems && (
              <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.text} disablePadding>
                      <ListItemButton 
                        sx={{ pl: 4 }}
                        onClick={() => navigate(subItem.path)}
                      >
                        <ListItemText primary={subItem.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Political Campaign Management System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationCenter />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {user?.phone_number}
          </Typography>
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout