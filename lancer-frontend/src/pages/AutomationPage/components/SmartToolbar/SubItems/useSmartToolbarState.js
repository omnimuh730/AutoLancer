import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import useDebouncedValue from '../../../../../utils/useDebouncedValue';
import { JobSource } from '../../../../../../../configs/pub';

export default function useSmartToolbarState({
	searchQuery,
	filters = {},
	onSearchChange,
	onFiltersChange,
	debounceMs = 600,
}) {
	const [localSearch, setLocalSearch] = useState(searchQuery || '');
	const [localCompany, setLocalCompany] = useState(filters['company.name'] || '');
	const [localPosition, setLocalPosition] = useState(filters['details.position'] || '');
	const [localRemote, setLocalRemote] = useState(filters['details.remote'] || '');
	const [localTime, setLocalTime] = useState(filters['details.time'] || '');
	const [localTags, setLocalTags] = useState(
		Array.isArray(filters['company.tags'])
			? filters['company.tags']
			: (filters['company.tags']
				? String(filters['company.tags'])
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
				: [])
	);

	const [localPostedAtFrom, setLocalPostedAtFrom] = useState(filters.postedAtFrom ? dayjs(filters.postedAtFrom) : null);
	const [localPostedAtTo, setLocalPostedAtTo] = useState(filters.postedAtTo ? dayjs(filters.postedAtTo) : null);

	const [jobsourceName, setJobsourceName] = useState(JobSource);

	// Keep local state in sync when parent filters/search change externally
	useEffect(() => setLocalSearch(searchQuery || ''), [searchQuery]);
	useEffect(() => setLocalCompany(filters['company.name'] || ''), [filters]);
	useEffect(() => setLocalPosition(filters['details.position'] || ''), [filters]);
	useEffect(() => setLocalRemote(filters['details.remote'] || ''), [filters]);
	useEffect(() => setLocalTime(filters['details.time'] || ''), [filters]);
	useEffect(() => setLocalTags(
		Array.isArray(filters['company.tags'])
			? filters['company.tags']
			: (filters['company.tags']
				? String(filters['company.tags'])
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
				: [])
	), [filters]);
	useEffect(() => setLocalPostedAtFrom(filters.postedAtFrom ? dayjs(filters.postedAtFrom) : null), [filters.postedAtFrom]);
	useEffect(() => setLocalPostedAtTo(filters.postedAtTo ? dayjs(filters.postedAtTo) : null), [filters.postedAtTo]);

	const debouncedSearch = useDebouncedValue(localSearch, debounceMs);
	const debouncedCompany = useDebouncedValue(localCompany, debounceMs);
	const debouncedPosition = useDebouncedValue(localPosition, debounceMs);

	// When debounced search changes, notify parent
	useEffect(() => {
		onSearchChange && onSearchChange(debouncedSearch);
	}, [debouncedSearch, onSearchChange]);

	// When debounced/local filter values change, notify parent
	useEffect(() => {
		const next = { ...filters };

		if (debouncedCompany && debouncedCompany.trim() !== '') next['company.name'] = debouncedCompany.trim(); else delete next['company.name'];
		if (debouncedPosition && debouncedPosition.trim() !== '') next['details.position'] = debouncedPosition.trim(); else delete next['details.position'];
		if (localRemote && localRemote !== '') next['details.remote'] = localRemote; else delete next['details.remote'];
		if (localTime && localTime !== '') next['details.time'] = localTime; else delete next['details.time'];
		if (Array.isArray(localTags) && localTags.length) next['company.tags'] = localTags; else delete next['company.tags'];

		if (localPostedAtFrom && dayjs(localPostedAtFrom).isValid()) {
			next.postedAtFrom = dayjs(localPostedAtFrom).format('YYYY-MM-DD');
		} else {
			delete next.postedAtFrom;
		}
		if (localPostedAtTo && dayjs(localPostedAtTo).isValid()) {
			next.postedAtTo = dayjs(localPostedAtTo).format('YYYY-MM-DD');
		} else {
			delete next.postedAtTo;
		}

		if (Array.isArray(jobsourceName) && jobsourceName.length > 0) {
			next.jobSources = jobsourceName.join(',');
		} else {
			delete next.jobSources;
		}

		try {
			const same = JSON.stringify(next) === JSON.stringify(filters);
			if (!same) onFiltersChange(next);
		} catch (e) {
			onFiltersChange(next);

			console.error('equality check failed in SmartToolbar filters change', e);
		}
	}, [debouncedCompany, debouncedPosition, localRemote, localTime, localTags, localPostedAtFrom, localPostedAtTo, filters, onFiltersChange, jobsourceName]);

	return {
		localSearch, setLocalSearch,
		localCompany, setLocalCompany,
		localPosition, setLocalPosition,
		localRemote, setLocalRemote,
		localTime, setLocalTime,
		localTags, setLocalTags,
		localPostedAtFrom, setLocalPostedAtFrom,
		localPostedAtTo, setLocalPostedAtTo,
		jobsourceName, setJobsourceName,
	};
}
