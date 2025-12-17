import { Container, Title, Text, Button, Group, Stack, Paper, TextInput, Select, Switch, Badge, Alert, Grid, useMantineTheme, ColorSwatch } from '@mantine/core';
import { IconInfoCircle, IconCheck } from '@tabler/icons-react';
import logoFoz from '../assets/logo_foz.png';

export function DesignSystemPage() {
    const theme = useMantineTheme();

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                {/* Branding Section */}
                <Paper withBorder p="md" radius="md">
                    <Title order={2} mb="md">Branding</Title>
                    <Group align="flex-end">
                        <Stack align="center">
                            <Text size="sm" c="dimmed">Original Logo</Text>
                            <img src={logoFoz} alt="Logo Foz do Iguaçu" style={{ height: 80 }} />
                        </Stack>
                        <Stack align="center">
                            <Text size="sm" c="dimmed">Avatar Size</Text>
                            <img src={logoFoz} alt="Logo Foz" style={{ height: 40, borderRadius: '50%' }} />
                        </Stack>
                    </Group>
                </Paper>

                {/* Colors Section */}
                <Paper withBorder p="md" radius="md">
                    <Title order={2} mb="md">Color Palette</Title>
                    <Stack>
                        <Group>
                            <Text fw={500} w={100}>Primary (Blue)</Text>
                            {theme.colors.fozBlue.map((color, index) => (
                                <ColorSwatch key={index} color={color} size={30} />
                            ))}
                        </Group>
                        <Group>
                            <Text fw={500} w={100}>Secondary (Green)</Text>
                            {theme.colors.fozGreen.map((color, index) => (
                                <ColorSwatch key={index} color={color} size={30} />
                            ))}
                        </Group>
                    </Stack>
                </Paper>

                {/* Typography Section */}
                <Paper withBorder p="md" radius="md">
                    <Title order={2} mb="md">Typography</Title>
                    <Stack gap="xs">
                        <Title order={1}>Heading 1 - The quick brown fox</Title>
                        <Title order={2}>Heading 2 - The quick brown fox</Title>
                        <Title order={3}>Heading 3 - The quick brown fox</Title>
                        <Text size="xl">Text XL - The quick brown fox jumps over the lazy dog</Text>
                        <Text size="md">Text MD - The quick brown fox jumps over the lazy dog</Text>
                        <Text size="sm" c="dimmed">Text SM (Dimmed) - The quick brown fox jumps over the lazy dog</Text>
                    </Stack>
                </Paper>

                {/* Components Section */}
                <Paper withBorder p="md" radius="md">
                    <Title order={2} mb="md">Interactive Components</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Stack>
                                <Title order={4}>Buttons</Title>
                                <Group>
                                    <Button variant="filled">Filled Button</Button>
                                    <Button variant="light">Light Button</Button>
                                    <Button variant="outline">Outline Button</Button>
                                    <Button variant="subtle">Subtle Button</Button>
                                </Group>
                                <Group>
                                    <Button color="fozGreen" variant="filled">Green Action</Button>
                                    <Button color="red" variant="light">Destructive</Button>
                                </Group>
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={6}>
                            <Stack>
                                <Title order={4}>Inputs</Title>
                                <TextInput label="Text Input" placeholder="Type something..." />
                                <Select label="Select Input" placeholder="Pick one" data={['React', 'Vue', 'Angular', 'Svelte']} />
                                <Switch label="Toggle Switch" />
                                <Switch label="Toggle Switch On" defaultChecked />
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* Feedback Section */}
                <Paper withBorder p="md" radius="md">
                    <Title order={2} mb="md">Feedback & States</Title>
                    <Stack>
                        <Group>
                            <Badge color="blue">Primary Badge</Badge>
                            <Badge color="green">Success Badge</Badge>
                            <Badge color="red">Error Badge</Badge>
                            <Badge color="yellow">Warning Badge</Badge>
                        </Group>

                        <Alert variant="light" color="blue" title="Info Alert" icon={<IconInfoCircle />}>
                            This is an informational message for the user.
                        </Alert>
                        <Alert variant="light" color="green" title="Success Alert" icon={<IconCheck />}>
                            Operation completed successfully.
                        </Alert>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}
