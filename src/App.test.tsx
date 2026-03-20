import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Idea Brainstorming flow', () => {
  it('shows the submitted query as the first user message in the workspace', async () => {
    const user = userEvent.setup();
    const query = 'How can I map multi-agent research workflows?';

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Idea Brainstorming/i }));
    await user.type(screen.getByPlaceholderText('Ask or refine your topic...'), query);
    await user.click(screen.getByRole('button', { name: /Manuscript Writing/i }));

    expect(screen.getByText(query)).toBeInTheDocument();
    expect(screen.queryByText('Basics of quantum technology')).not.toBeInTheDocument();
  });
});
