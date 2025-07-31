import React, { useState, useEffect, useMemo } from 'react'
import { Search, Upload, Download, BarChart3, RefreshCw, Filter } from 'lucide-react'
import voterDataService, { type VoterRecord } from '../../services/voterData'
import FileUpload from '../../components/FileUpload'
import { 
  Button, 
  Input, 
  Modal, 
  ModalTrigger, 
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownSeparator,
} from '../../components/ui'

// Separate data-fetching hook for RSC-like pattern
const useVoterData = () => {
  const [voters, setVoters] = useState<VoterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchVoters = async (params: {
    search?: string
    state?: string
    party_affiliation?: string
    registration_status?: string
    page: number
    page_size: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await voterDataService.getVoters(params)
      setVoters(result.results)
      setTotalCount(result.count)
    } catch (err: any) {
      console.error('Failed to fetch voters:', err)
      setError(err.response?.data?.error || 'Failed to load voter data')
    } finally {
      setLoading(false)
    }
  }

  return { voters, loading, error, totalCount, fetchVoters }
}

// Client-side interactive components
const VoterFilters: React.FC<{
  searchTerm: string
  setSearchTerm: (term: string) => void
  stateFilter: string
  setStateFilter: (state: string) => void
  partyFilter: string
  setPartyFilter: (party: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  onRefresh: () => void
  loading: boolean
}> = ({
  searchTerm,
  setSearchTerm,
  stateFilter,
  setStateFilter,
  partyFilter,
  setPartyFilter,
  statusFilter,
  setStatusFilter,
  onRefresh,
  loading
}) => {
  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mb-6">
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4">
        <div className="tw-flex-1">
          <Input
            placeholder="Search voters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-pl-10"
          />
          <Search className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-h-4 tw-w-4 tw-text-gray-400" />
        </div>
        
        <Dropdown
          trigger={
            <DropdownButton variant="outline">
              <Filter className="tw-h-4 tw-w-4 tw-mr-2" />
              State: {stateFilter || 'All'}
            </DropdownButton>
          }
        >
          <DropdownItem onSelect={() => setStateFilter('')}>All States</DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={() => setStateFilter('CA')}>California</DropdownItem>
          <DropdownItem onSelect={() => setStateFilter('TX')}>Texas</DropdownItem>
          <DropdownItem onSelect={() => setStateFilter('FL')}>Florida</DropdownItem>
          <DropdownItem onSelect={() => setStateFilter('NY')}>New York</DropdownItem>
        </Dropdown>

        <Dropdown
          trigger={
            <DropdownButton variant="outline">
              Party: {partyFilter || 'All'}
            </DropdownButton>
          }
        >
          <DropdownItem onSelect={() => setPartyFilter('')}>All Parties</DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={() => setPartyFilter('Democratic')}>Democratic</DropdownItem>
          <DropdownItem onSelect={() => setPartyFilter('Republican')}>Republican</DropdownItem>
          <DropdownItem onSelect={() => setPartyFilter('Independent')}>Independent</DropdownItem>
          <DropdownItem onSelect={() => setPartyFilter('Other')}>Other</DropdownItem>
        </Dropdown>

        <Dropdown
          trigger={
            <DropdownButton variant="outline">
              Status: {statusFilter || 'All'}
            </DropdownButton>
          }
        >
          <DropdownItem onSelect={() => setStatusFilter('')}>All Statuses</DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={() => setStatusFilter('active')}>Active</DropdownItem>
          <DropdownItem onSelect={() => setStatusFilter('inactive')}>Inactive</DropdownItem>
          <DropdownItem onSelect={() => setStatusFilter('pending')}>Pending</DropdownItem>
        </Dropdown>

        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={loading}
          className="tw-flex tw-items-center tw-gap-2"
        >
          <RefreshCw className={`tw-h-4 tw-w-4 ${loading ? 'tw-animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}

const VoterTable: React.FC<{
  voters: VoterRecord[]
  loading: boolean
  page: number
  rowsPerPage: number
  totalCount: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newRowsPerPage: number) => void
}> = ({
  voters,
  loading,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange
}) => {
  const getStatusBadgeClass = (status: string | null | undefined) => {
    switch ((status ?? '').toLowerCase()) {
      case 'active':
        return 'tw-bg-green-100 tw-text-green-800'
      case 'inactive':
        return 'tw-bg-gray-100 tw-text-gray-800'
      case 'pending':
        return 'tw-bg-yellow-100 tw-text-yellow-800'
      default:
        return 'tw-bg-gray-100 tw-text-gray-800'
    }
  }

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Name
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Phone
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Address
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                State
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Party
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Registration Date
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="tw-px-6 tw-py-4 tw-text-center">
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                    <RefreshCw className="tw-h-4 tw-w-4 tw-animate-spin" />
                    <span className="tw-text-sm tw-text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : voters.length === 0 ? (
              <tr>
                <td colSpan={7} className="tw-px-6 tw-py-4 tw-text-center">
                  <span className="tw-text-sm tw-text-gray-500">No voter records found</span>
                </td>
              </tr>
            ) : (
              voters.map((voter) => (
                <tr key={voter.id} className="hover:tw-bg-gray-50">
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-text-sm tw-font-medium tw-text-gray-900">
                      {voter.name || `${voter.first_name} ${voter.last_name}`.trim()}
                    </div>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                    {voter.phone}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-text-sm tw-text-gray-900 tw-max-w-xs tw-truncate">
                      {voter.address ? `${voter.address}, ${voter.city}` : 'Not provided'}
                    </div>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                    {voter.state}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                    {voter.party_affiliation}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <span className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${getStatusBadgeClass(voter.voter_registration_status)}`}>
                      {voter.voter_registration_status || 'Unknown'}
                    </span>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                    {voter.voter_registration_date 
                      ? new Date(voter.voter_registration_date).toLocaleDateString()
                      : 'Not available'
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="tw-bg-white tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between tw-border-t tw-border-gray-200 sm:tw-px-6">
        <div className="tw-flex-1 tw-flex tw-justify-between sm:tw-hidden">
          <Button
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={(page + 1) * rowsPerPage >= totalCount}
          >
            Next
          </Button>
        </div>
        <div className="tw-hidden sm:tw-flex-1 sm:tw-flex sm:tw-items-center sm:tw-justify-between">
          <div>
            <p className="tw-text-sm tw-text-gray-700">
              Showing <span className="tw-font-medium">{page * rowsPerPage + 1}</span> to{' '}
              <span className="tw-font-medium">
                {Math.min((page + 1) * rowsPerPage, totalCount)}
              </span>{' '}
              of <span className="tw-font-medium">{totalCount}</span> results
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-4">
            <Dropdown
              trigger={
                <DropdownButton variant="outline" className="tw-text-sm">
                  {rowsPerPage} per page
                </DropdownButton>
              }
            >
              <DropdownItem onSelect={() => onRowsPerPageChange(10)}>10 per page</DropdownItem>
              <DropdownItem onSelect={() => onRowsPerPageChange(25)}>25 per page</DropdownItem>
              <DropdownItem onSelect={() => onRowsPerPageChange(50)}>50 per page</DropdownItem>
              <DropdownItem onSelect={() => onRowsPerPageChange(100)}>100 per page</DropdownItem>
            </Dropdown>
            <div className="tw-flex tw-gap-2">
              <Button
                variant="outline"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(page + 1)}
                disabled={(page + 1) * rowsPerPage >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component using RSC-like pattern
const VoterDataOptimized: React.FC = () => {
  const { voters, loading, error, totalCount, fetchVoters } = useVoterData()
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [partyFilter, setPartyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [showUpload, setShowUpload] = useState(false)

  // Memoized fetch parameters (RSC-like optimization)
  const fetchParams = useMemo(() => ({
    search: searchTerm || undefined,
    state: stateFilter || undefined,
    party_affiliation: partyFilter || undefined,
    registration_status: statusFilter || undefined,
    page: page + 1,
    page_size: rowsPerPage,
  }), [searchTerm, stateFilter, partyFilter, statusFilter, page, rowsPerPage])

  useEffect(() => {
    fetchVoters(fetchParams)
  }, [fetchParams])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }

  const handleRefresh = () => {
    fetchVoters(fetchParams)
  }

  return (
    <div className="tw-space-y-6">
      <div>
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Voter Data Management</h1>
        <p className="tw-mt-2 tw-text-gray-600">
          Manage voter databases, upload new data, and analyze voter engagement patterns.
        </p>
      </div>

      {error && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-4">
          <div className="tw-flex">
            <div className="tw-ml-3">
              <h3 className="tw-text-sm tw-font-medium tw-text-red-800">Error</h3>
              <div className="tw-mt-2 tw-text-sm tw-text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4">
        <Modal open={showUpload} onOpenChange={setShowUpload}>
          <ModalTrigger asChild>
            <Button className="tw-flex tw-items-center tw-gap-2">
              <Upload className="tw-h-4 tw-w-4" />
              Upload CSV Data
            </Button>
          </ModalTrigger>
          <div className="tw-p-6">
            <div className="tw-mb-4">
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-900">Upload Voter Data</h3>
              <p className="tw-text-sm tw-text-gray-600">Select a CSV file to upload voter information.</p>
            </div>
            <FileUpload 
              onUploadComplete={() => {
                setShowUpload(false)
                handleRefresh()
              }}
            />
          </div>
        </Modal>
        
        <Button variant="outline" className="tw-flex tw-items-center tw-gap-2">
          <Download className="tw-h-4 tw-w-4" />
          Export Data
        </Button>
        
        <Button variant="outline" className="tw-flex tw-items-center tw-gap-2">
          <BarChart3 className="tw-h-4 tw-w-4" />
          Analytics
        </Button>
      </div>

      <VoterFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        partyFilter={partyFilter}
        setPartyFilter={setPartyFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <VoterTable
        voters={voters}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  )
}

export default VoterDataOptimized