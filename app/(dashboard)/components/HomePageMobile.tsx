// import React, { useState, useEffect, useMemo } from "react";
// import {
//   List,
//   ListItem,
//   ListItemText,
//   IconButton,
//   TextField,
//   Typography,
//   Box,
//   AppBar,
//   Toolbar,
//   SwipeableDrawer,
//   ListItemIcon,
//   Divider,
//   CircularProgress,
//   ListItemButton,
//   Button,
//   Chip,
//   Menu,
//   MenuItem,
//   Badge,
//   Card,
//   CardActionArea,
//   CardContent,
//   Avatar,
//   InputAdornment,
//   Fab,
//   BottomNavigation,
//   BottomNavigationAction,
//   Paper
// } from "@mui/material";
// import {
//   Search,
//   Menu as MenuIcon,
//   Add,
//   Home,
//   Archive,
//   Person,
//   People,
//   MenuBook,
//   Restaurant,
//   FilterList,
//   Sort,
//   Notifications,
//   Settings,
//   Dashboard,
//   Description,
//   Print,
//   Edit,
//   KeyboardArrowDown
// } from "@mui/icons-material";
// import { Recipe } from "@/types/Recipe";
// import { useAuth } from "@/hooks/useAuth";
// import { Permission, hasPermission } from "@/types/Permission";
// import Link from "next/link";
// import LogoutButton from "@/components/ui/LogoutButton";
// import ProtectedComponent from "@/components/ui/ProtectedComponent";

// const HomePageMobile: React.FC = () => {
//   const [recipes, setRecipes] = useState<Recipe[]>([]);
//   const [search, setSearch] = useState("");
//   const [station, setStation] = useState("");
//   const [stations, setStations] = useState<string[]>([]);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
//   const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
//   const [sortBy, setSortBy] = useState("name");
//   const [navValue, setNavValue] = useState(0);
//   const { user } = useAuth();

//   // Filter menu states
//   const filterMenuOpen = Boolean(filterAnchorEl);
//   const sortMenuOpen = Boolean(sortAnchorEl);

//   useEffect(() => {
//     if (user) {
//       fetchRecipes();
//     }
//   }, [user]);

//   const fetchRecipes = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("/api/recipes");
//       if (!response.ok) throw new Error("Failed to fetch recipes");
//       const data: Recipe[] = await response.json();
//       setRecipes(data);

//       // Extract unique stations
//       const uniqueStations = Array.from(
//         new Set(data.map((recipe) => recipe.station))
//       ).filter(Boolean);
//       setStations(uniqueStations);
//     } catch (error) {
//       console.error("Error fetching recipes: ", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredRecipes = useMemo(() => {
//     return recipes
//       .filter((recipe) => recipe.name.toLowerCase().includes(search.toLowerCase()))
//       .filter((recipe) => (station ? recipe.station === station : true))
//       .sort((a, b) => {
//         if (sortBy === "name") return a.name.localeCompare(b.name);
//         if (sortBy === "station") return a.station.localeCompare(b.station);
//         if (sortBy === "date") return a.createdDate.localeCompare(b.createdDate);
//         return 0;
//       });
//   }, [recipes, search, station, sortBy]);

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearch(e.target.value);
//   };

//   const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
//     setFilterAnchorEl(event.currentTarget);
//   };

//   const handleFilterMenuClose = () => {
//     setFilterAnchorEl(null);
//   };

//   const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
//     setSortAnchorEl(event.currentTarget);
//   };

//   const handleSortMenuClose = () => {
//     setSortAnchorEl(null);
//   };

//   const getStationColor = (station: string) => {
//     const stationColors: Record<string, string> = {
//       'Garde Manger': 'bg-emerald-100 text-emerald-800',
//       'Entremetier': 'bg-blue-100 text-blue-800',
//       'Pastry': 'bg-purple-100 text-purple-800',
//       'Functions': 'bg-amber-100 text-amber-800',
//     };

//     return stationColors[station] || 'bg-gray-100 text-gray-800';
//   };

//   const renderDrawer = () => (
//     <Box sx={{ width: 250 }} role="presentation">
//       <Box className="p-4 flex items-center justify-center mb-2">
//         <MenuBook className="text-primary mr-2 text-xl" />
//         <Typography variant="h6" className="font-semibold text-primary">
//           Recipe Manager
//         </Typography>
//       </Box>
//       <Divider />
//       <List>
//         <ListItemButton
//           component={Link}
//           href="/"
//           className="px-4"
//           selected
//         >
//           <ListItemIcon>
//             <Dashboard className="text-primary" />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItemButton>

//         <ListItemButton className="px-4">
//           <ListItemIcon>
//             <MenuBook />
//           </ListItemIcon>
//           <ListItemText primary="My Recipes" />
//         </ListItemButton>

//         <ListItemButton className="px-4">
//           <ListItemIcon>
//             <Restaurant />
//           </ListItemIcon>
//           <ListItemText primary="Kitchen Stations" />
//         </ListItemButton>

//         {user && hasPermission(user.role, Permission.EDIT_RECIPES) && (
//           <ListItemButton
//             component={Link}
//             href="/archives"
//             className="px-4"
//           >
//             <ListItemIcon>
//               <Archive />
//             </ListItemIcon>
//             <ListItemText primary="Archives" />
//           </ListItemButton>
//         )}

//         {user && hasPermission(user.role, Permission.VIEW_USERS) && (
//           <ListItemButton
//             component={Link}
//             href="/users"
//             className="px-4"
//           >
//             <ListItemIcon>
//               <People />
//             </ListItemIcon>
//             <ListItemText primary="User Management" />
//           </ListItemButton>
//         )}
//       </List>
//       <Divider />
//       <List>
//         <ListItemButton
//           component={Link}
//           href="/profile"
//           className="px-4"
//         >
//           <ListItemIcon>
//             <Person />
//           </ListItemIcon>
//           <ListItemText primary="Profile" />
//         </ListItemButton>

//         <ListItemButton className="px-4">
//           <ListItemIcon>
//             <Settings />
//           </ListItemIcon>
//           <ListItemText primary="Settings" />
//         </ListItemButton>

//         <ListItem className="px-4">
//           <LogoutButton />
//         </ListItem>
//       </List>
//     </Box>
//   );

//   return (
//     <Box className="min-h-screen bg-gray-50 pb-16">
//       <AppBar position="static" elevation={0} className="bg-white border-b border-gray-200">
//         <Toolbar>
//           <IconButton
//             edge="start"
//             color="inherit"
//             aria-label="menu"
//             onClick={() => setDrawerOpen(true)}
//             className="text-gray-700"
//           >
//             <MenuIcon />
//           </IconButton>
//           <Typography variant="h6" component="div" className="flex-grow text-gray-800 font-semibold">
//             Recipes
//           </Typography>
//           <IconButton color="inherit" className="text-gray-700">
//             <Badge badgeContent={3} color="error">
//               <Notifications />
//             </Badge>
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       <Box className="p-4">
//         <TextField
//           fullWidth
//           variant="outlined"
//           placeholder="Search recipes"
//           value={search}
//           onChange={handleSearch}
//           size="small"
//           className="mb-4"
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <Search className="text-gray-400" />
//               </InputAdornment>
//             ),
//             className: "bg-white rounded-md"
//           }}
//         />

//         <div className="flex gap-2 mb-4">
//           <Button
//             id="filter-button-mobile"
//             variant="outlined"
//             className="whitespace-nowrap text-gray-700 border-gray-300 flex-1"
//             size="small"
//             onClick={handleFilterMenuOpen}
//             endIcon={<KeyboardArrowDown />}
//             startIcon={<FilterList />}
//           >
//             Filter
//           </Button>

//           <Button
//             id="sort-button-mobile"
//             variant="outlined"
//             className="whitespace-nowrap text-gray-700 border-gray-300 flex-1"
//             size="small"
//             onClick={handleSortMenuOpen}
//             endIcon={<KeyboardArrowDown />}
//             startIcon={<Sort />}
//           >
//             Sort By
//           </Button>
//         </div>

//         <Menu
//           id="filter-menu-mobile"
//           anchorEl={filterAnchorEl}
//           open={filterMenuOpen}
//           onClose={handleFilterMenuClose}
//           MenuListProps={{
//             'aria-labelledby': 'filter-button-mobile',
//           }}
//         >
//           <MenuItem onClick={() => { setStation(""); handleFilterMenuClose(); }} selected={station === ""}>
//             <Typography>All Stations</Typography>
//           </MenuItem>
//           <Divider />
//           {stations.map((stationItem) => (
//             <MenuItem
//               key={stationItem}
//               onClick={() => { setStation(stationItem); handleFilterMenuClose(); }}
//               selected={station === stationItem}
//             >
//               <Typography>{stationItem}</Typography>
//             </MenuItem>
//           ))}
//         </Menu>

//         <Menu
//           id="sort-menu-mobile"
//           anchorEl={sortAnchorEl}
//           open={sortMenuOpen}
//           onClose={handleSortMenuClose}
//           MenuListProps={{
//             'aria-labelledby': 'sort-button-mobile',
//           }}
//         >
//           <MenuItem onClick={() => { setSortBy("name"); handleSortMenuClose(); }} selected={sortBy === "name"}>
//             <Typography>Name</Typography>
//           </MenuItem>
//           <MenuItem onClick={() => { setSortBy("station"); handleSortMenuClose(); }} selected={sortBy === "station"}>
//             <Typography>Station</Typography>
//           </MenuItem>
//           <MenuItem onClick={() => { setSortBy("date"); handleSortMenuClose(); }} selected={sortBy === "date"}>
//             <Typography>Date Created</Typography>
//           </MenuItem>
//         </Menu>
//       </Box>

//       {isLoading ? (
//         <Box className="flex justify-center my-8">
//           <CircularProgress className="text-primary" />
//         </Box>
//       ) : filteredRecipes.length > 0 ? (
//         <List className="pb-16">
//           {filteredRecipes.map((recipe) => (
//             <Card
//               key={recipe._id}
//               className="mb-3 mx-4 border border-gray-200 rounded-lg shadow-sm"
//               elevation={0}
//             >
//               <CardActionArea
//                 component={Link}
//                 href={`/recipe/${recipe._id}`}
//                 className="p-1"
//               >
//                 <CardContent>
//                   <Box className="flex justify-between items-start">
//                     <Box>
//                       <Typography variant="h6" className="font-medium text-gray-900 mb-1">
//                         {recipe.name}
//                       </Typography>
//                       <Chip
//                         label={recipe.station}
//                         size="small"
//                         className={`${getStationColor(recipe.station)} text-xs py-0.5 font-medium mb-2`}
//                       />
//                       <Typography variant="body2" className="text-gray-500">
//                         Version: {recipe.version || "N/A"}
//                       </Typography>
//                     </Box>

//                     <Box className="flex flex-col gap-1">
//                       <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
//                         <IconButton
//                           component={Link}
//                           href={`/edit/${recipe._id}`}
//                           size="small"
//                           className="text-blue-500"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <Edit fontSize="small" />
//                         </IconButton>
//                       </ProtectedComponent>

//                       <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
//                         <IconButton
//                           size="small"
//                           className="text-gray-600"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             /* Implement print functionality */
//                           }}
//                         >
//                           <Print fontSize="small" />
//                         </IconButton>
//                       </ProtectedComponent>
//                     </Box>
//                   </Box>
//                 </CardContent>
//               </CardActionArea>
//             </Card>
//           ))}
//         </List>
//       ) : (
//         <Box className="flex flex-col items-center justify-center p-8 text-center">
//           <Description fontSize="large" className="text-gray-300 mb-2" />
//           <Typography variant="h6" className="text-gray-500 mb-2">
//             No recipes found
//           </Typography>
//           <Typography variant="body2" className="text-gray-400 mb-6">
//             {search || station ? "Try adjusting your filters" : "Get started by adding your first recipe"}
//           </Typography>
//         </Box>
//       )}

//       <SwipeableDrawer
//         anchor="left"
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//         onOpen={() => setDrawerOpen(true)}
//       >
//         {renderDrawer()}
//       </SwipeableDrawer>

//       <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
//         <Fab
//           color="primary"
//           aria-label="add"
//           component={Link}
//           href="/add"
//           className="fixed right-4 bottom-20 bg-primary text-white"
//         >
//           <Add />
//         </Fab>
//       </ProtectedComponent>

//       <Paper
//         className="fixed bottom-0 left-0 right-0 z-10"
//         elevation={3}
//       >
//         <BottomNavigation
//           value={navValue}
//           onChange={(event, newValue) => {
//             setNavValue(newValue);
//           }}
//           showLabels
//           className="border-t border-gray-200"
//         >
//           <BottomNavigationAction
//             label="Home"
//             icon={<Home />}
//             component={Link}
//             href="/"
//           />
//           <BottomNavigationAction
//             label="Recipes"
//             icon={<MenuBook />}
//           />
//           <BottomNavigationAction
//             label="Profile"
//             icon={<Person />}
//             component={Link}
//             href="/profile"
//           />
//         </BottomNavigation>
//       </Paper>
//     </Box>
//   );
// };

// export default HomePageMobile;