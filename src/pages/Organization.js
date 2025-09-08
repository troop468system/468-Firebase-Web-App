import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as UsersIcon,
  Add as PlusIcon,
  Close as XIcon,
  CheckCircle as UserCheckIcon,
  Security as ShieldIcon,
  // Chair as ChairIcon,
  School as SchoolIcon,
  // EmojiEvents as AwardIcon,
  Assignment as AssignmentIcon,
  // AttachMoney as MoneyIcon,
  Store as StoreIcon,
  Description as SecretaryIcon,
  Camera as MediaIcon,
  Computer as SystemIcon,
  Support as AdvisorIcon,
  Star as MeritIcon,
  Flag as PresidentialIcon,
  LocalHospital as NHPAIcon,
  MenuBook as ScoutbookIcon,
  // Gavel as GavelIcon,
  CorporateFare as CommitteeIcon,
  SupervisorAccount as ViceChairIcon,
  AccountBox as ScoutMasterIcon,
  NaturePeople as CampingIcon,
  Inventory as EquipmentIcon,
  Event as EventIcon,
  AccountBalance as FinanceIcon,
  Storefront as FundraisingIcon,
} from '@mui/icons-material';
import PageTitle from '../components/PageTitle';

const Organization = () => {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  
  // Sample people for dropdowns
  const [people] = useState([
    'John Smith', 'Mary Johnson', 'David Brown', 'Sarah Wilson', 'Mike Davis',
    'Lisa Anderson', 'Robert Taylor', 'Jennifer White', 'William Jones', 'Jessica Garcia',
    'Christopher Martinez', 'Amanda Rodriguez', 'Matthew Lewis', 'Ashley Walker',
    'Joshua Hall', 'Nicole Young', 'Andrew King', 'Stephanie Wright', 'Daniel Lopez',
    'Brittany Hill', 'Ryan Green', 'Samantha Adams', 'Tyler Baker', 'Rachel Nelson'
  ]);

  // Organization structure state
  const [assignments, setAssignments] = useState({
    // Top level
    'Committee Chair': [],
    
    // Second level
    'Vice Committee Chair': [],
    'Scout Master': [],
    
    // Under Vice Committee Chair
    'Advancement Chair': [],
    'Camping Chair': [],
    'Equipment Chair': [],
    'Event Chair': [],
    'Finance Chair': [],
    'Fundraising Chair': [],
    'Popcorn Chair': [],
    'Secretary': [],
    'Media Chair': [],
    'System Admins': [],
    'Advisors': [],
    
    // Under Scout Master
    'Merit Badge': [],
    'Presidential Award': [],
    'NHPA': [],
    'Scoutbook': [],
  });

  // Patrol-based Assistant Scout Masters - grouped by patrol
  const [patrolAssignments, setPatrolAssignments] = useState({
    'Eagles Patrol': ['Robert Taylor', 'Matthew Lewis'],
    'Hawks Patrol': ['Christopher Martinez']
  });

  const [newPatrolAssignment, setNewPatrolAssignment] = useState({ patrol: '', person: '' });

  const availablePatrols = [
    'Eagles Patrol', 'Hawks Patrol', 'Bears Patrol', 'Wolves Patrol', 
    'Panthers Patrol', 'Lions Patrol', 'Tigers Patrol', 'Cobras Patrol'
  ];

  // ===== Scouts hierarchy state =====
  const [scoutAssignments, setScoutAssignments] = useState({
    'Senior Patrol Leader': [''],
    'Troop Guide': [''],
    'Scribe': [''],
    'Quartermaster': [''],
    'Historian': [''],
    'Librarian': [''],
    'Den Chief': [''],
    "Chaplain's Aide": [''],
    'Instructor': [''],
    'Webmaster': ['']
  });
  const [asplAssignments, setAsplAssignments] = useState(['']); // Assistant Senior Patrol Leaders (growable)

  const handleAssignment = (position, index, person) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      const currentList = [...(newAssignments[position] || [])];
      currentList[index] = person;
      newAssignments[position] = currentList;
      return newAssignments;
    });
  };

  // const handleScoutAssignment = (position, index, person) => {
  //   setScoutAssignments(prev => {
  //     const next = { ...prev };
  //     const list = [...(next[position] || [])];
  //     list[index] = person;
  //     next[position] = list;
  //     return next;
  //   });
  // };

  const addPersonSlot = (position) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      const currentList = [...(newAssignments[position] || [])];
      currentList.push('');
      newAssignments[position] = currentList;
      return newAssignments;
    });
  };

  // const addScoutPersonSlot = (position) => {
  //   setScoutAssignments(prev => {
  //     const next = { ...prev };
  //     const list = [...(next[position] || [])];
  //     list.push('');
  //     next[position] = list;
  //     return next;
  //   });
  // };

  const removePersonSlot = (position, index) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      const currentList = [...(newAssignments[position] || [])];
      currentList.splice(index, 1);
      newAssignments[position] = currentList;
      return newAssignments;
    });
  };

  // const removeScoutPersonSlot = (position, index) => {
  //   setScoutAssignments(prev => {
  //     const next = { ...prev };
  //     const list = [...(next[position] || [])];
  //     list.splice(index, 1);
  //     next[position] = list;
  //     return next;
  //   });
  // };

  const addPatrolAssignment = () => {
    if (newPatrolAssignment.patrol && newPatrolAssignment.person) {
      setPatrolAssignments(prev => {
        const updated = { ...prev };
        if (updated[newPatrolAssignment.patrol]) {
          updated[newPatrolAssignment.patrol] = [...updated[newPatrolAssignment.patrol], newPatrolAssignment.person];
        } else {
          updated[newPatrolAssignment.patrol] = [newPatrolAssignment.person];
        }
        return updated;
      });
      setNewPatrolAssignment({ patrol: '', person: '' });
    }
  };

  const removePatrolPerson = (patrol, personIndex) => {
    setPatrolAssignments(prev => {
      const updated = { ...prev };
      updated[patrol] = updated[patrol].filter((_, i) => i !== personIndex);
      if (updated[patrol].length === 0) {
        delete updated[patrol];
      }
      return updated;
    });
  };

  const updatePatrolPerson = (patrol, personIndex, newPerson) => {
    setPatrolAssignments(prev => {
      const updated = { ...prev };
      updated[patrol][personIndex] = newPerson;
      return updated;
    });
  };

  const addPersonToPatrol = (patrol) => {
    setPatrolAssignments(prev => {
      const updated = { ...prev };
      if (updated[patrol]) {
        updated[patrol] = [...updated[patrol], ''];
      } else {
        updated[patrol] = [''];
      }
      return updated;
    });
  };

  const getAssignedCount = () => {
    let count = 0;
    Object.values(assignments).forEach((assignment) => {
      count += (assignment || []).filter(person => person !== '').length;
    });
    // Add patrol assignments
    Object.values(patrolAssignments).forEach((people) => {
      count += people.filter(person => person !== '').length;
    });
    return count;
  };

  const getTotalSlots = () => {
    let count = 0;
    Object.values(assignments).forEach((assignment) => {
      count += Math.max(1, (assignment || []).length);
    });
    // Add patrol slots
    Object.values(patrolAssignments).forEach((people) => {
      count += Math.max(1, people.length);
    });
    return count;
  };

  // Scout tab counters
  const getScoutAssignedCount = () => {
    let count = 0;
    Object.values(scoutAssignments).forEach((assignment) => {
      count += (assignment || []).filter(p => p !== '').length;
    });
    count += asplAssignments.filter(p => p !== '').length;
    return count;
  };

  const getScoutTotalSlots = () => {
    let count = 0;
    Object.values(scoutAssignments).forEach((assignment) => {
      count += Math.max(1, (assignment || []).length);
    });
    count += Math.max(1, asplAssignments.length);
    return count;
  };

  const getPositionIcon = (title) => {
    const iconMap = {
      'Committee Chair': CommitteeIcon,
      'Vice Committee Chair': ViceChairIcon,
      'Scout Master': ScoutMasterIcon,
      'Advancement Chair': SchoolIcon,
      'Camping Chair': CampingIcon,
      'Equipment Chair': EquipmentIcon,
      'Event Chair': EventIcon,
      'Finance Chair': FinanceIcon,
      'Fundraising Chair': FundraisingIcon,
      'Popcorn Chair': StoreIcon,
      'Secretary': SecretaryIcon,
      'Media Chair': MediaIcon,
      'System Admins': SystemIcon,
      'Advisors': AdvisorIcon,
      'Merit Badge': MeritIcon,
      'Presidential Award': PresidentialIcon,
      'NHPA': NHPAIcon,
      'Scoutbook': ScoutbookIcon,
    };
    return iconMap[title] || AssignmentIcon;
  };

  const PositionCard = ({ title, assignments: positionAssignments = [], level = 0 }) => {
    const getCardColor = () => {
      if (title === 'Committee Chair') return { bg: '#FFCDD2', border: '#E57373' };
      if (title === 'Vice Committee Chair') return { bg: '#C8E6C9', border: '#81C784' };
      if (title === 'Scout Master') return { bg: '#BBDEFB', border: '#64B5F6' };
      if (title === 'Senior Patrol Leader') return { bg: '#FFCDD2', border: '#F44336' };
      if (title === 'Troop Guide') return { bg: '#C8E6C9', border: '#4CAF50' };
      return { bg: '#FFF9C4', border: '#FFD54F' };
    };

    const colors = getCardColor();
    const displayList = positionAssignments.length === 0 ? [''] : positionAssignments;
    const hasAssignments = positionAssignments.some(person => person !== '');

    return (
      <Card sx={{ 
        minWidth: 200, 
        maxWidth: 200,
        m: 1.5, 
        bgcolor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            {React.createElement(getPositionIcon(title), { 
              sx: { mr: 0.5, fontSize: 16, color: 'primary.main' } 
            })}
            <Typography variant="caption" fontWeight="bold" sx={{ 
              fontSize: '0.7rem', 
              color: '#37474F'
            }}>
              {title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {displayList.map((person, index) => (
              <Box key={index} display="flex" alignItems="center" gap={0.5}>
                <FormControl size="small" sx={{ 
                  flex: 1, 
                  '& .MuiSelect-select': { fontSize: '0.65rem', py: 0.5 } 
                }}>
                  <Select
                    value={person}
                    onChange={(e) => handleAssignment(title, index, e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select Person...</MenuItem>
                    {people.map(personName => (
                      <MenuItem key={personName} value={personName} sx={{ fontSize: '0.65rem' }}>
                        {personName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {index === 0 ? (
                  <IconButton
                    onClick={() => addPersonSlot(title)}
                    color="primary"
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <PlusIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() => removePersonSlot(title, index)}
                    color="error"
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <XIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          {hasAssignments && (
            <Box display="flex" alignItems="center" mt={1}>
              <UserCheckIcon sx={{ fontSize: 12, mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                {positionAssignments.filter(p => p !== '').length} Assigned
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const AssistantScoutMastersCard = () => {
    const totalAssigned = Object.values(patrolAssignments).reduce((sum, people) => 
      sum + people.filter(person => person !== '').length, 0);

    return (
      <Card sx={{ 
        minWidth: 250, 
        maxWidth: 250,
        m: 0.75, 
        bgcolor: '#E3F2FD',
        border: '2px solid #64B5F6',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            <ShieldIcon sx={{ mr: 0.5, fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight="bold" sx={{ 
              fontSize: '0.7rem', 
              color: '#37474F'
            }}>
              Assistant Scout Masters
            </Typography>
          </Box>

          {/* Existing Patrol Groups */}
          <Box sx={{ mb: 1 }}>
            {Object.entries(patrolAssignments).map(([patrol, people]) => (
              <Card key={patrol} sx={{ 
                mb: 1, 
                bgcolor: 'white', 
                border: '1px solid #BBDEFB',
                borderRadius: 1
              }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ShieldIcon sx={{ mr: 0.5, fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>
                      {patrol}
                    </Typography>
                    <IconButton
                      onClick={() => addPersonToPatrol(patrol)}
                      color="primary"
                      size="small"
                      sx={{ ml: 'auto', p: 0.5 }}
                    >
                      <PlusIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  
                  {/* People in this patrol */}
                  {people.map((person, personIndex) => (
                    <Box key={personIndex} display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      {person && person !== '' ? (
                        // Show assigned person as text
                        <Box 
                          sx={{ 
                            flex: 1, 
                            p: 1, 
                            bgcolor: 'rgba(100, 181, 246, 0.1)',
                            borderRadius: 1,
                            border: '1px solid rgba(100, 181, 246, 0.3)'
                          }}
                        >
                          <Typography sx={{ fontSize: '0.65rem', color: '#37474F' }}>
                            {person}
                          </Typography>
                        </Box>
                      ) : (
                        // Show dropdown for empty slots
                        <FormControl size="small" sx={{ flex: 1 }}>
                          <Select
                            value={person}
                            onChange={(e) => updatePatrolPerson(patrol, personIndex, e.target.value)}
                            displayEmpty
                            sx={{ 
                              borderRadius: 1,
                              '& .MuiSelect-select': { fontSize: '0.65rem', py: 0.5 }
                            }}
                          >
                            <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select Person...</MenuItem>
                            {people.map(availablePerson => (
                              <MenuItem key={availablePerson} value={availablePerson} sx={{ fontSize: '0.65rem' }}>
                                {availablePerson}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      <IconButton
                        onClick={() => removePatrolPerson(patrol, personIndex)}
                        color="error"
                        size="small"
                        sx={{ p: 0.5 }}
                      >
                        <XIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Add New Assignment */}
          <Card sx={{ bgcolor: '#F5F5F5', border: '1px dashed #BBDEFB' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', mb: 1, display: 'block' }}>
                Add New Assistant Scout Master:
              </Typography>
              <Box sx={{ mb: 1 }}>
                <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                  <Select
                    value={newPatrolAssignment.patrol}
                    onChange={(e) => setNewPatrolAssignment(prev => ({ ...prev, patrol: e.target.value }))}
                    displayEmpty
                    sx={{ 
                      borderRadius: 1,
                      '& .MuiSelect-select': { fontSize: '0.65rem', py: 0.5 }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select Patrol...</MenuItem>
                    {availablePatrols.map(patrol => (
                      <MenuItem key={patrol} value={patrol} sx={{ fontSize: '0.65rem' }}>
                        {patrol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <Select
                    value={newPatrolAssignment.person}
                    onChange={(e) => setNewPatrolAssignment(prev => ({ ...prev, person: e.target.value }))}
                    displayEmpty
                    sx={{ 
                      borderRadius: 1,
                      '& .MuiSelect-select': { fontSize: '0.65rem', py: 0.5 }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select Person...</MenuItem>
                    {people.map(personName => (
                      <MenuItem key={personName} value={personName} sx={{ fontSize: '0.65rem' }}>
                        {personName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <IconButton
                onClick={addPatrolAssignment}
                color="primary"
                disabled={!newPatrolAssignment.patrol || !newPatrolAssignment.person}
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: '100%',
                  borderRadius: 1,
                  py: 1
                }}
              >
                <PlusIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography sx={{ fontSize: '0.65rem' }}>Add Assistant Scout Master</Typography>
              </IconButton>
            </CardContent>
          </Card>

          <Box display="flex" alignItems="center">
            <UserCheckIcon sx={{ fontSize: 10, mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              {totalAssigned} Assigned
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Assistant Senior Patrol Leaders (ASPLs)
  const AssistantSeniorPatrolLeadersCard = () => {
    const totalAssigned = asplAssignments.filter(p => p !== '').length;
    return (
      <Card sx={{ minWidth: 250, maxWidth: 250, m: 0.75, bgcolor: '#E3F2FD', border: '2px solid #64B5F6', borderRadius: 2 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            <ShieldIcon sx={{ mr: 0.5, fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', color: '#37474F' }}>
              Assistant Senior Patrol Leaders
            </Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            {asplAssignments.map((person, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select value={person} onChange={(e)=>{
                    const v = e.target.value; setAsplAssignments(prev=>{ const list=[...prev]; list[idx]=v; return list; });
                  }} displayEmpty sx={{ borderRadius: 1, '& .MuiSelect-select': { fontSize: '0.6rem', py: 0.5 } }}>
                    <MenuItem value="" sx={{ fontSize: '0.6rem' }}>Select Person...</MenuItem>
                    {people.map(p => (<MenuItem key={p} value={p} sx={{ fontSize: '0.6rem' }}>{p}</MenuItem>))}
                  </Select>
                </FormControl>
                {idx === 0 ? (
                  <IconButton onClick={() => setAsplAssignments(prev=>[...prev, ''])} color="primary" size="small" sx={{ p: 0.5 }}>
                    <PlusIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => setAsplAssignments(prev=>prev.filter((_,i)=>i!==idx))} color="error" size="small" sx={{ p: 0.5 }}>
                    <XIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" alignItems="center">
            <UserCheckIcon sx={{ fontSize: 10, mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              {totalAssigned} Assigned
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Senior Patrol Leader Card (single dropdown)
  const SeniorPatrolLeaderCard = () => {
    const currentSPL = (scoutAssignments['Senior Patrol Leader'] || [''])[0];
    const isAssigned = currentSPL && currentSPL !== '';

    return (
      <Card sx={{ minWidth: 250, maxWidth: 250, m: 0.75, bgcolor: '#FFCDD2', border: '2px solid #F44336', borderRadius: 2 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            <ShieldIcon sx={{ mr: 0.5, fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', color: '#37474F' }}>
              Senior Patrol Leader
            </Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <FormControl size="small" fullWidth>
              <Select 
                value={currentSPL} 
                onChange={(e) => {
                  const v = e.target.value; 
                  setScoutAssignments(prev => ({ 
                    ...prev, 
                    'Senior Patrol Leader': [v] 
                  }));
                }} 
                displayEmpty 
                sx={{ borderRadius: 1, '& .MuiSelect-select': { fontSize: '0.6rem', py: 0.5 } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.6rem' }}>Select Person...</MenuItem>
                {people.map(p => (<MenuItem key={p} value={p} sx={{ fontSize: '0.6rem' }}>{p}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" alignItems="center">
            <UserCheckIcon sx={{ fontSize: 10, mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              {isAssigned ? '1 Assigned' : '0 Assigned'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Multi-Person Scout Position Card (similar to ASPL)
  const MultiScoutPositionCard = ({ title, assignments }) => {
    const getCardColor = () => {
      if (title === 'Troop Guide') return { bg: '#C8E6C9', border: '#4CAF50' };
      return { bg: '#FFF9C4', border: '#FFD54F' };
    };

    const colors = getCardColor();
    const currentAssignments = assignments || [''];
    const totalAssigned = currentAssignments.filter(p => p !== '').length;

    return (
      <Card sx={{ minWidth: 250, maxWidth: 250, m: 0.75, bgcolor: colors.bg, border: `2px solid ${colors.border}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            <ShieldIcon sx={{ mr: 0.5, fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', color: '#37474F' }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            {currentAssignments.map((person, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select value={person} onChange={(e)=>{
                    const v = e.target.value; 
                    setScoutAssignments(prev=>{ 
                      const next = {...prev}; 
                      const list = [...(next[title] || [])]; 
                      list[idx] = v; 
                      next[title] = list; 
                      return next; 
                    });
                  }} displayEmpty sx={{ borderRadius: 1, '& .MuiSelect-select': { fontSize: '0.6rem', py: 0.5 } }}>
                    <MenuItem value="" sx={{ fontSize: '0.6rem' }}>Select Person...</MenuItem>
                    {people.map(p => (<MenuItem key={p} value={p} sx={{ fontSize: '0.6rem' }}>{p}</MenuItem>))}
                  </Select>
                </FormControl>
                {idx === 0 ? (
                  <IconButton onClick={() => {
                    setScoutAssignments(prev=>{ 
                      const next = {...prev}; 
                      const list = [...(next[title] || [])]; 
                      list.push(''); 
                      next[title] = list; 
                      return next; 
                    });
                  }} color="primary" size="small" sx={{ p: 0.5 }}>
                    <PlusIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => {
                    setScoutAssignments(prev=>{ 
                      const next = {...prev}; 
                      const list = [...(next[title] || [])]; 
                      list.splice(idx, 1); 
                      next[title] = list; 
                      return next; 
                    });
                  }} color="error" size="small" sx={{ p: 0.5 }}>
                    <XIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" alignItems="center">
            <UserCheckIcon sx={{ fontSize: 10, mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              {totalAssigned} Assigned
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Initialize tab based on URL parameter
  const getTabFromUrl = (urlTab) => {
    switch(urlTab) {
      case 'scouts': return 0;
      case 'adults': return 1;
      default: return 0; // Default to scouts
    }
  };
  
  const [tab, setTab] = useState(getTabFromUrl(urlTab));
  
  // Update URL when tab changes
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    const tabPath = newValue === 0 ? 'scouts' : 'adults';
    navigate(`/organization/${tabPath}`, { replace: true });
  };
  
  // Update tab when URL changes
  useEffect(() => {
    setTab(getTabFromUrl(urlTab));
  }, [urlTab]);

  const assignedCount = tab === 0 ? getScoutAssignedCount() : getAssignedCount();
  const totalSlots = tab === 0 ? getScoutTotalSlots() : getTotalSlots();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageTitle 
        icon={UsersIcon} 
        title="Organization" 
        description="Manage troop leadership positions and committee assignments"
      />
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 0 }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Scouts" />
            <Tab label="Adults" />
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Card sx={{ bgcolor: 'primary.light', p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2">
                  <strong>People Assigned:</strong> {assignedCount}/{totalSlots} positions
                </Typography>
                <Box sx={{ width: 200 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={totalSlots > 0 ? (assignedCount / totalSlots) * 100 : 0} 
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" fontWeight="bold" color="primary.dark">
                {totalSlots > 0 ? Math.round((assignedCount / totalSlots) * 100) : 0}% Complete
              </Typography>
            </Box>
          </Card>
        </CardContent>
      </Card>

      {/* Adult Organization (existing) */}
      {tab === 1 && (
      <Card>
        <CardContent>
          <Box sx={{ overflow: 'auto', minWidth: 'fit-content' }}>
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              sx={{ 
                minWidth: { xs: 320, sm: 600, md: 1000 },
                px: { xs: 1, sm: 2, md: 0 }
              }}
            >
              
              {/* Committee Chair - Top Level */}
              <Box display="flex" justifyContent="center" mb={3}>
                <PositionCard 
                  title="Committee Chair" 
                  assignments={assignments['Committee Chair']} 
                />
              </Box>

              {/* Connection Lines */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Box sx={{ borderLeft: '2px solid #999', height: 30 }} />
                <Box sx={{ 
                  borderTop: '2px solid #999', 
                  width: { xs: 200, sm: 300, md: 400 }
                }} />
                <Box display="flex" justifyContent="space-between" sx={{ 
                  width: { xs: 200, sm: 300, md: 400 }
                }}>
                  <Box sx={{ borderLeft: '2px solid #999', height: 30 }} />
                  <Box sx={{ borderLeft: '2px solid #999', height: 30 }} />
                </Box>
              </Box>

              {/* Second Level - Vice Committee Chair and Scout Master */}
              <Box 
                display="flex" 
                justifyContent="center" 
                gap={{ xs: 2, sm: 4, md: 8 }} 
                mb={4}
                flexDirection={{ xs: 'column', sm: 'row' }}
                alignItems="center"
              >
                <Box display="flex" flexDirection="column" alignItems="center">
                  <PositionCard 
                    title="Vice Committee Chair" 
                    assignments={assignments['Vice Committee Chair']} 
                  />
                  
                  {/* Connection to committee positions */}
                  <Box sx={{ borderLeft: '2px solid #999', height: 30, my: 2 }} />
                  
                  {/* Committee Positions under Vice Committee Chair */}
                  <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} sx={{ maxWidth: 600 }}>
                    {[
                      'Advancement Chair', 'Camping Chair', 'Equipment Chair', 'Event Chair',
                      'Finance Chair', 'Fundraising Chair', 'Popcorn Chair', 'Secretary',
                      'Media Chair', 'System Admins', 'Advisors'
                    ].map(position => (
                      <PositionCard 
                        key={position}
                        title={position} 
                        assignments={assignments[position]} 
                      />
                    ))}
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" alignItems="center">
                  <PositionCard 
                    title="Scout Master" 
                    assignments={assignments['Scout Master']} 
                  />
                  
                  {/* Connection to scout positions */}
                  <Box sx={{ borderLeft: '2px solid #999', height: 30, my: 2 }} />
                  
                  {/* Scout Master Positions - Aligned Side by Side in Same Row */}
                  <Box display="flex" justifyContent="center" alignItems="flex-start" gap={3} sx={{ 
                    flexWrap: 'nowrap',
                    width: '100%',
                    maxWidth: '900px',
                    margin: '0 auto'
                  }}>
                    {/* Assistant Scout Masters Card - Blue */}
                    <Box sx={{ flex: '0 0 auto' }}>
                      <AssistantScoutMastersCard />
                    </Box>
                    
                    {/* Other Scout Master Positions - Yellow Cards in Column */}
                    <Box display="flex" flexDirection="column" gap={1.5} sx={{ flex: '0 0 auto' }}>
                      {[
                        'Merit Badge', 'Presidential Award', 'NHPA', 'Scoutbook'
                      ].map(position => (
                        <PositionCard 
                          key={position}
                          title={position} 
                          assignments={assignments[position]} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* Scout Organization */}
      {tab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ overflow: 'auto', minWidth: 'fit-content' }}>
              <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 900 }}>
                {/* SPL Top */}
                <Box display="flex" justifyContent="center" mb={3}>
                  <SeniorPatrolLeaderCard />
                </Box>
                {/* Connectors */}
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Box sx={{ borderLeft: '2px solid #999', height: 30 }} />
                </Box>
                {/* Below SPL: ASPL group and other positions */}
                <Box display="flex" justifyContent="center" alignItems="flex-start" gap={3} sx={{ flexWrap: 'nowrap', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                  <Box sx={{ flex: '0 0 auto' }}>
                    <AssistantSeniorPatrolLeadersCard />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1.5} sx={{ flex: '0 0 auto' }}>
                    <MultiScoutPositionCard title="Troop Guide" assignments={scoutAssignments['Troop Guide']} />
                  </Box>
                  {/* All positions in two columns */}
                  <Box display="flex" gap={1.5} sx={{ flex: '0 0 auto' }}>
                    {/* First Column */}
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {['Scribe','Quartermaster','Den Chief','Instructor'].map(position => (
                        <MultiScoutPositionCard key={position} title={position} assignments={scoutAssignments[position]} />
                      ))}
                    </Box>
                    {/* Second Column */}
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {['Historian','Librarian',"Chaplain's Aide",'Webmaster'].map(position => (
                        <MultiScoutPositionCard key={position} title={position} assignments={scoutAssignments[position]} />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Organization;