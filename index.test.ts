import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { $ } from 'bun';

// Mock the $ function for testing
const mockExec = mock(() => Promise.resolve({ text: () => Promise.resolve('') }));

// Import the functions we want to test
// Since we need to test internal functions, we'll need to export them from index.ts
// For now, let's create a test version of the functions

interface PullRequest {
  number: number;
  headRefName: string;
  baseRefName: string;
}

// Test version of getPullRequest function
async function getPullRequest(branch: string): Promise<PullRequest | null> {
  try {
    const result = await $`gh pr view --json number,headRefName,baseRefName ${branch}`.text();
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
  beforeEach(() => {
    // Reset mocks before each test
    mockExec.mockClear();
  });

  describe('getPullRequest', () => {
    it('should return PR data when PR exists', async () => {
      const mockPR = {
        number: 123,
        headRefName: 'feature-branch',
        baseRefName: 'main'
      };

      // Mock the $ function to return our test data
      const mockDollar = spyOn($, 'text').mockResolvedValue(JSON.stringify(mockPR));

      const result = await getPullRequest('feature-branch');

      expect(result).toEqual(mockPR);
      expect(mockDollar).toHaveBeenCalledTimes(1);
      
      mockDollar.mockRestore();
    });

    it('should return null when PR does not exist', async () => {
      // Mock the $ function to throw an error
      const mockDollar = spyOn($, 'text').mockRejectedValue(new Error('No PR found'));

      const result = await getPullRequest('nonexistent-branch');

      expect(result).toBeNull();
      
      mockDollar.mockRestore();
    });
  });

  describe('buildPRChain', () => {
    it('should build a simple PR chain', async () => {
      const mockPRs = [
        { number: 2, headRefName: 'feature-2', baseRefName: 'feature-1' },
        { number: 1, headRefName: 'feature-1', baseRefName: 'main' }
      ];

      let callCount = 0;
      const mockDollar = spyOn($, 'text').mockImplementation(async () => {
        const pr = mockPRs[callCount];
        callCount++;
        return JSON.stringify(pr);
      });

      const result = await buildPRChain('feature-2', 'main');

      expect(result).toEqual(['feature-2', 'feature-1', 'main']);
      expect(mockDollar).toHaveBeenCalledTimes(2);
      
      mockDollar.mockRestore();
    });

    it('should build a single-link PR chain', async () => {
      const mockPR = { number: 1, headRefName: 'feature-1', baseRefName: 'main' };

      const mockDollar = spyOn($, 'text').mockResolvedValue(JSON.stringify(mockPR));

      const result = await buildPRChain('feature-1', 'main');

      expect(result).toEqual(['feature-1', 'main']);
      expect(mockDollar).toHaveBeenCalledTimes(1);
      
      mockDollar.mockRestore();
    });

    it('should return just the base branch when start and base are the same', async () => {
      const result = await buildPRChain('main', 'main');

      expect(result).toEqual(['main']);
    });

    it('should throw error when PR not found in chain', async () => {
      const mockDollar = spyOn($, 'text').mockRejectedValue(new Error('No PR found'));

      await expect(buildPRChain('nonexistent-branch', 'main')).rejects.toThrow(
        'No pull request found for branch: nonexistent-branch'
      );
      
      mockDollar.mockRestore();
    });

    it('should build a complex PR chain', async () => {
      const mockPRs = [
        { number: 4, headRefName: 'feature-4', baseRefName: 'feature-3' },
        { number: 3, headRefName: 'feature-3', baseRefName: 'feature-2' },
        { number: 2, headRefName: 'feature-2', baseRefName: 'feature-1' },
        { number: 1, headRefName: 'feature-1', baseRefName: 'dev' }
      ];

      let callCount = 0;
      const mockDollar = spyOn($, 'text').mockImplementation(async () => {
        const pr = mockPRs[callCount];
        callCount++;
        return JSON.stringify(pr);
      });

      const result = await buildPRChain('feature-4', 'dev');

      expect(result).toEqual(['feature-4', 'feature-3', 'feature-2', 'feature-1', 'dev']);
      expect(mockDollar).toHaveBeenCalledTimes(4);
      
      mockDollar.mockRestore();
    });
  });
});