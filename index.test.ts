import { describe, it, expect, mock, beforeEach } from 'bun:test';

interface PullRequest {
  number: number;
  headRefName: string;
  baseRefName: string;
}

// Mock implementation for testing
let mockGhCommand: (branch: string) => Promise<string>;

// Test version of getPullRequest function
async function getPullRequest(branch: string): Promise<PullRequest | null> {
  try {
    const result = await mockGhCommand(branch);
    return JSON.parse(result);
  } catch (error) {
    return null;
  }
}

// Test version of buildPRChain function  
async function buildPRChain(startBranch: string, baseBranch: string): Promise<string[]> {
  const chain: string[] = [];
  let currentBranch = startBranch;

  while (currentBranch !== baseBranch) {
    const pr = await getPullRequest(currentBranch);
    if (!pr) {
      throw new Error(`No pull request found for branch: ${currentBranch}`);
    }

    chain.push(currentBranch);
    currentBranch = pr.baseRefName;
  }

  chain.push(baseBranch);
  return chain;
}

describe('gh-propagate', () => {
  describe('getPullRequest', () => {
    it('should return PR data when PR exists', async () => {
      const mockPR = {
        number: 123,
        headRefName: 'feature-branch',
        baseRefName: 'main'
      };

      mockGhCommand = async (branch: string) => {
        return JSON.stringify(mockPR);
      };

      const result = await getPullRequest('feature-branch');

      expect(result).toEqual(mockPR);
    });

    it('should return null when PR does not exist', async () => {
      mockGhCommand = async (branch: string) => {
        throw new Error('No PR found');
      };

      const result = await getPullRequest('nonexistent-branch');

      expect(result).toBeNull();
    });
  });

  describe('buildPRChain', () => {
    it('should build a simple PR chain', async () => {
      const mockPRs = [
        { number: 2, headRefName: 'feature-2', baseRefName: 'feature-1' },
        { number: 1, headRefName: 'feature-1', baseRefName: 'main' }
      ];

      let callCount = 0;
      mockGhCommand = async (branch: string) => {
        const pr = mockPRs[callCount];
        callCount++;
        return JSON.stringify(pr);
      };

      const result = await buildPRChain('feature-2', 'main');

      expect(result).toEqual(['feature-2', 'feature-1', 'main']);
    });

    it('should build a single-link PR chain', async () => {
      const mockPR = { number: 1, headRefName: 'feature-1', baseRefName: 'main' };

      mockGhCommand = async (branch: string) => {
        return JSON.stringify(mockPR);
      };

      const result = await buildPRChain('feature-1', 'main');

      expect(result).toEqual(['feature-1', 'main']);
    });

    it('should return just the base branch when start and base are the same', async () => {
      const result = await buildPRChain('main', 'main');

      expect(result).toEqual(['main']);
    });

    it('should throw error when PR not found in chain', async () => {
      mockGhCommand = async (branch: string) => {
        throw new Error('No PR found');
      };

      await expect(buildPRChain('nonexistent-branch', 'main')).rejects.toThrow(
        'No pull request found for branch: nonexistent-branch'
      );
    });

    it('should build a complex PR chain', async () => {
      const mockPRs = [
        { number: 4, headRefName: 'feature-4', baseRefName: 'feature-3' },
        { number: 3, headRefName: 'feature-3', baseRefName: 'feature-2' },
        { number: 2, headRefName: 'feature-2', baseRefName: 'feature-1' },
        { number: 1, headRefName: 'feature-1', baseRefName: 'dev' }
      ];

      let callCount = 0;
      mockGhCommand = async (branch: string) => {
        const pr = mockPRs[callCount];
        callCount++;
        return JSON.stringify(pr);
      };

      const result = await buildPRChain('feature-4', 'dev');

      expect(result).toEqual(['feature-4', 'feature-3', 'feature-2', 'feature-1', 'dev']);
    });
  });
});