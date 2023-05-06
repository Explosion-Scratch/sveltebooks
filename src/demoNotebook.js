export const demoNotebook = `
		# A car is moving 14.4 m/s when it hits the brakes. It slows for 78.8 m, which takes 9.92 s. It then accelerates at 1.83 m/s2 for 4.50 s. What is the total displacement?

	## Part 1
	vi_1 = 14.4
	dx_1 = 78.8
	t_1 = 9.92

	// Solve for vf
	// Use 1d kinematic equation: dx = 1/2(vf + vi)*t
	vf_1 = dx_1*2/t_1 - vi_1

	## Part 2 → Use vf to continue equation
	vi_2 = vf_1
	a_2 = 1.83
	t_2 = 4.50
	
	// Missing vf, solve for dx
	dx_2 = vi_2*t_2 + 0.5*a_2*t_2^2
  total = dx_1 + dx_2
	
	# The total distance is {total}
	`.trim().split('\n').map(i => i.trim()).join('\n')

export const notebookTemplate = `# Your New Notebook

days_coding_this = 2
hours_per_day = 4
total_hours = days_coding_this * hours_per_day

# 🌟 Star on GitHub because I spent {total_hours} making this!`