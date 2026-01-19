import React, { useState } from 'react';
import {
    Modal, Group, TextInput, Grid, Tooltip, ScrollArea,
    UnstyledButton, Text, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    Building, Briefcase, Users, UserCheck, ClipboardList, Archive, Vote,
    Activity, HeartPulse, Stethoscope, Syringe, Thermometer, Pill, Landmark,
    Wallet, Banknote, Calculator, Receipt, Percent, GraduationCap, School,
    BookOpen, Library, Truck, Bus, Car, Construction, HardHat, MapPin,
    Monitor, Server, Database, Wrench, Zap, Wifi, Cpu, Leaf, Trees, Package,
    Search
} from 'lucide-react';

// Mapeamento de Ícones
export const ICON_MAP: Record<string, React.ElementType> = {
    'building': Building, 'briefcase': Briefcase, 'users': Users,
    'user-check': UserCheck, 'clipboard': ClipboardList, 'archive': Archive,
    'vote': Vote, 'activity': Activity, 'heart-pulse': HeartPulse,
    'stethoscope': Stethoscope, 'syringe': Syringe, 'thermometer': Thermometer,
    'pill': Pill, 'landmark': Landmark, 'wallet': Wallet,
    'banknote': Banknote, 'calculator': Calculator, 'receipt': Receipt,
    'percent': Percent, 'grad-cap': GraduationCap, 'school': School,
    'book': BookOpen, 'library': Library, 'truck': Truck,
    'bus': Bus, 'car': Car, 'construction': Construction,
    'hardhat': HardHat, 'map-pin': MapPin, 'monitor': Monitor,
    'server': Server, 'database': Database, 'wrench': Wrench,
    'zap': Zap, 'wifi': Wifi, 'cpu': Cpu,
    'leaf': Leaf, 'tree': Trees, 'package': Package
};

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (iconKey: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const [search, setSearch] = useState('');

    const filteredIcons = Object.keys(ICON_MAP).filter(key =>
        key.toLowerCase().includes(search.toLowerCase())
    );

    const SelectedIconComponent = ICON_MAP[selectedIcon] || Building;

    return (
        <>
            <Group>
                <Tooltip label="Clique para alterar o ícone">
                    <UnstyledButton
                        onClick={open}
                        style={(theme) => ({
                            width: 50,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: theme.radius.md,
                            backgroundColor: theme.colors.cyan[0], // teal-50 equivalentish
                            color: theme.colors.cyan[7],
                            border: `1px solid ${theme.colors.cyan[2]}`
                        })}
                    >
                        <SelectedIconComponent size={24} />
                    </UnstyledButton>
                </Tooltip>
                <Box>
                    <Text size="sm" fw={500} style={{ lineHeight: 1 }}>Ícone</Text>
                    <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={open}>Alterar...</Text>
                </Box>
            </Group>

            <Modal opened={opened} onClose={close} title="Biblioteca de Ícones" size="lg">
                <TextInput
                    placeholder="Buscar ícone..."
                    leftSection={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    mb="md"
                />

                <ScrollArea h={300}>
                    <Grid gutter="xs">
                        {filteredIcons.map(key => {
                            const Icon = ICON_MAP[key];
                            return (
                                <Grid.Col key={key} span={2}>
                                    <Tooltip label={key}>
                                        <UnstyledButton
                                            onClick={() => { onSelect(key); close(); }}
                                            style={(theme) => ({
                                                width: '100%',
                                                aspectRatio: '1 / 1',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: theme.radius.md,
                                                border: `1px solid ${theme.colors.gray[2]}`,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    backgroundColor: theme.colors.cyan[0],
                                                    borderColor: theme.colors.cyan[5],
                                                    color: theme.colors.cyan[7]
                                                }
                                            })}
                                        >
                                            <Icon size={24} />
                                        </UnstyledButton>
                                    </Tooltip>
                                </Grid.Col>
                            );
                        })}
                        {filteredIcons.length === 0 && (
                            <Grid.Col span={12}>
                                <Text ta="center" c="dimmed" py="xl">Nenhum ícone encontrado.</Text>
                            </Grid.Col>
                        )}
                    </Grid>
                </ScrollArea>
            </Modal>
        </>
    );
}
